"""FocusOS — Analytics Router"""

import logging
from fastapi import APIRouter, Depends
from services.analytics_service import AnalyticsService
from utils.auth import get_current_user_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview")
async def get_overview(user_id: str = Depends(get_current_user_id)):
    return {"status": "success", "data": AnalyticsService.get_overview(user_id)}


@router.get("/productivity")
async def get_productivity(user_id: str = Depends(get_current_user_id)):
    return {"status": "success", "data": AnalyticsService.get_productivity_trends(user_id)}


@router.get("/contributions")
async def get_contributions(user_id: str = Depends(get_current_user_id)):
    return {"status": "success", "data": AnalyticsService.get_agent_contributions(user_id)}


@router.get("/intelligence")
async def get_intelligence(user_id: str = Depends(get_current_user_id)):
    return {"status": "success", "data": AnalyticsService.get_intelligence_reports(user_id)}


@router.get("/heatmap")
async def get_heatmap(user_id: str = Depends(get_current_user_id)):
    return {"status": "success", "data": AnalyticsService.get_productivity_heatmap(user_id)}


@router.get("/briefing")
async def get_briefing(user_id: str = Depends(get_current_user_id)):
    return {"status": "success", "data": AnalyticsService.generate_chief_of_staff_briefing(user_id)}


@router.get("/voice")
async def get_voice_analytics(user_id: str = Depends(get_current_user_id)):
    return {"status": "success", "data": AnalyticsService.get_agent_metrics("Voice Agent", user_id)}


@router.get("/vision")
async def get_vision_analytics(user_id: str = Depends(get_current_user_id)):
    return {"status": "success", "data": AnalyticsService.get_agent_metrics("Vision Agent", user_id)}


@router.get("/documents")
async def get_documents_analytics(user_id: str = Depends(get_current_user_id)):
    return {"status": "success", "data": AnalyticsService.get_agent_metrics("Document Agent", user_id)}


@router.get("/interventions")
async def get_interventions_analytics(user_id: str = Depends(get_current_user_id)):
    return {"status": "success", "data": AnalyticsService.get_intervention_metrics(user_id)}


@router.get("/twin-accuracy")
async def get_twin_accuracy(user_id: str = Depends(get_current_user_id)):
    return {"status": "success", "data": AnalyticsService.get_twin_accuracy(user_id)}


@router.get("/insights")
async def get_insights(user_id: str = Depends(get_current_user_id)):
    return {"status": "success", "data": AnalyticsService.get_insights(user_id)}
