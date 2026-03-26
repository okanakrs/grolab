import asyncio
import json
import logging
import os
from typing import Literal, Optional

import httpx
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from services.billing_service import consume_credit, get_credit_snapshot

router = APIRouter(tags=["tools"])
logger = logging.getLogger("grolab.router.tools")

ToolType = Literal["marketing", "tech_stack", "competitor", "roadmap"]

_TOOL_PROMPTS: dict[str, str] = {
    "marketing": (
        "SaaS fikri için kapsamlı bir pazarlama stratejisi hazırla.\n"
        "Ürün: {isim} | Problem: {problem} | Çözüm: {cozum} | Hedef: {hedef_kitle}\n\n"
        "Şunları içersin (madde madde, kısa ve uygulanabilir):\n"
        "1) Konumlandırma & temel mesaj\n"
        "2) En etkili 3 edinme kanalı\n"
        "3) İçerik stratejisi\n"
        "4) İlk 30 günlük lansman planı\n"
        "Türkçe yanıt ver."
    ),
    "tech_stack": (
        "SaaS fikri için ideal teknik altyapıyı öner.\n"
        "Ürün: {isim} | Problem: {problem} | Çözüm: {cozum} | Hedef: {hedef_kitle}\n\n"
        "Şunları içersin:\n"
        "1) Frontend\n2) Backend\n3) Veritabanı\n4) Hosting / Infra\n5) 3rd-party servisler\n"
        "Her seçim için 1 cümlelik neden açıkla. Türkçe yanıt ver."
    ),
    "competitor": (
        "SaaS fikri için derinlemesine rakip analizi yap.\n"
        "Ürün: {isim} | Problem: {problem} | Çözüm: {cozum} | Hedef: {hedef_kitle}\n\n"
        "Şunları içersin:\n"
        "1) Doğrudan rakipler (3-5 adet) — güçlü ve zayıf yönleri\n"
        "2) Dolaylı / alternatif çözümler\n"
        "3) Boş nişler ve fark yaratma fırsatları\n"
        "4) Rekabet avantajı önerileri\n"
        "Türkçe yanıt ver."
    ),
    "roadmap": (
        "SaaS fikri için 3 aylık MVP yol haritası hazırla.\n"
        "Ürün: {isim} | Problem: {problem} | Çözüm: {cozum} | Hedef: {hedef_kitle}\n\n"
        "Her ay için:\n"
        "- Temel hedef\n"
        "- 3-4 ana iş maddesi\n"
        "- Başarı kriteri\n"
        "Gerçekçi ve uygulanabilir ol. Türkçe yanıt ver."
    ),
}


class IdeaInput(BaseModel):
    isim: str
    problem: str
    cozum: str
    hedef_kitle: str
    tahmini_mrr_potansiyeli: str


class ToolRequest(BaseModel):
    idea: IdeaInput
    tool: ToolType


class ToolResponse(BaseModel):
    result: str


async def _call_claude(idea: IdeaInput, tool: ToolType) -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is missing")

    template = _TOOL_PROMPTS[tool]
    prompt = template.format(
        isim=idea.isim,
        problem=idea.problem,
        cozum=idea.cozum,
        hedef_kitle=idea.hedef_kitle,
    )

    payload = {
        "model": os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
        "max_tokens": 3000,
        "temperature": 0.6,
        "system": "Sen deneyimli bir SaaS danışmanısın. Net, uygulanabilir ve kısa yanıtlar ver.",
        "messages": [{"role": "user", "content": prompt}],
    }

    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        response.raise_for_status()

    data = response.json()
    return "".join(block.get("text", "") for block in data.get("content", [])).strip()


@router.post("/tools/analyze", response_model=ToolResponse)
async def analyze_idea(
    payload: ToolRequest,
    x_user_id: Optional[str] = Header(default=None),
) -> ToolResponse:
    user_id = (x_user_id or "").strip() or "demo-user"

    snapshot = await get_credit_snapshot(user_id)
    if snapshot.plan == "free":
        raise HTTPException(status_code=403, detail="Pro plan required for premium tools")

    ok = await consume_credit(user_id, 1)
    if not ok:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    try:
        result = await _call_claude(payload.idea, payload.tool)
    except Exception:
        logger.exception(f"tool_analyze_failed tool={payload.tool} user_id={user_id}")
        raise HTTPException(status_code=500, detail="Analiz sırasında bir hata oluştu")

    logger.info(f"tool_analyze_success tool={payload.tool} user_id={user_id}")
    return ToolResponse(result=result)
