"""FocusOS — Reports Router"""

import io
import logging
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

from services.analytics_service import AnalyticsService
from utils.auth import get_current_user_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/download")
async def download_report(user_id: str = Depends(get_current_user_id)):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    styles = getSampleStyleSheet()

    title_style = styles["Heading1"]
    title_style.alignment = 1
    h2_style = styles["Heading2"]
    normal_style = styles["Normal"]

    elements = []
    elements.append(Paragraph("FocusOS Executive Intelligence Report", title_style))
    elements.append(Spacer(1, 12))

    briefing = AnalyticsService.generate_chief_of_staff_briefing(user_id)
    elements.append(Paragraph("AI Chief-of-Staff Briefing", h2_style))
    elements.append(Paragraph(str(briefing), normal_style))
    elements.append(Spacer(1, 24))

    overview = AnalyticsService.get_overview(user_id)
    elements.append(Paragraph("Key Performance Indicators", h2_style))

    data = [
        ["Metric", "Value"],
        ["Productivity Score", f"{overview.get('productivity_score', 0)}%"],
        ["Completion Rate", f"{overview.get('completion_rate', 0)}%"],
        ["Future Risk Forecast", overview.get("future_risk_forecast", "Unknown")],
        ["AI Confidence", f"{overview.get('ai_confidence_score', 0)}%"],
    ]
    t = Table(data, colWidths=[200, 100])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#0f172a")),
        ("TEXTCOLOR", (0, 1), (-1, -1), colors.whitesmoke),
        ("GRID", (0, 0), (-1, -1), 1, colors.HexColor("#334155")),
    ]))
    elements.append(t)
    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=FocusOS_Intelligence_Report.pdf"},
    )
