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

_TOOL_PROMPTS_EN: dict[str, str] = {
    "marketing": (
        "Prepare a comprehensive marketing strategy for this SaaS idea.\n"
        "Product: {isim} | Problem: {problem} | Solution: {cozum} | Target: {hedef_kitle}\n\n"
        "Include the following (bullet points, concise and actionable):\n"
        "1) Positioning & core message\n"
        "2) Top 3 acquisition channels\n"
        "3) Content strategy\n"
        "4) First 30-day launch plan\n"
        "Respond in English."
    ),
    "tech_stack": (
        "Recommend the ideal tech stack for this SaaS idea.\n"
        "Product: {isim} | Problem: {problem} | Solution: {cozum} | Target: {hedef_kitle}\n\n"
        "Include:\n"
        "1) Frontend\n2) Backend\n3) Database\n4) Hosting / Infra\n5) 3rd-party services\n"
        "Explain each choice in one sentence. Respond in English."
    ),
    "competitor": (
        "Perform an in-depth competitor analysis for this SaaS idea.\n"
        "Product: {isim} | Problem: {problem} | Solution: {cozum} | Target: {hedef_kitle}\n\n"
        "Include:\n"
        "1) Direct competitors (3-5) — strengths and weaknesses\n"
        "2) Indirect / alternative solutions\n"
        "3) Empty niches and differentiation opportunities\n"
        "4) Competitive advantage recommendations\n"
        "Respond in English."
    ),
    "roadmap": (
        "Prepare a 3-month MVP roadmap for this SaaS idea.\n"
        "Product: {isim} | Problem: {problem} | Solution: {cozum} | Target: {hedef_kitle}\n\n"
        "For each month:\n"
        "- Core objective\n"
        "- 3-4 main action items\n"
        "- Success criteria\n"
        "Be realistic and actionable. Respond in English."
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
    lang: str = "tr"


class ToolResponse(BaseModel):
    result: str


async def _call_claude(idea: IdeaInput, tool: ToolType, lang: str = "tr") -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is missing")

    prompts = _TOOL_PROMPTS_EN if lang == "en" else _TOOL_PROMPTS
    template = prompts[tool]
    prompt = template.format(
        isim=idea.isim,
        problem=idea.problem,
        cozum=idea.cozum,
        hedef_kitle=idea.hedef_kitle,
    )

    system = (
        "You are an experienced SaaS consultant. Give clear, actionable, and concise answers."
        if lang == "en"
        else "Sen deneyimli bir SaaS danışmanısın. Net, uygulanabilir ve kısa yanıtlar ver."
    )

    payload = {
        "model": os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
        "max_tokens": 3000,
        "temperature": 0.6,
        "system": system,
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
        result = await _call_claude(payload.idea, payload.tool, lang=payload.lang)
    except Exception:
        logger.exception(f"tool_analyze_failed tool={payload.tool} user_id={user_id}")
        raise HTTPException(status_code=500, detail="Analiz sırasında bir hata oluştu")

    logger.info(f"tool_analyze_success tool={payload.tool} user_id={user_id}")
    return ToolResponse(result=result)
