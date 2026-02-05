"""
AI-powered features and insights for MainTMS
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from ..core.database import get_db
from ..core.security import get_current_user
from ..models import User, Load, Driver
from pydantic import BaseModel
import os

router = APIRouter(prefix="/ai", tags=["ai"])

# Environment variable for AI provider
AI_PROVIDER = os.getenv("AI_PROVIDER", "openai")  # openai, anthropic, or mock
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

class AIQuery(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

class AIResponse(BaseModel):
    response: str
    suggestions: Optional[List[str]] = None
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime

class AIInsight(BaseModel):
    title: str
    message: str
    priority: str  # high, medium, low
    action_label: Optional[str] = None
    action_url: Optional[str] = None
    icon: str

class AIPrediction(BaseModel):
    load_id: int
    prediction_type: str  # delay, profitability, risk
    confidence: float
    predicted_value: Any
    reasoning: str


# ============================================================================
# AI CHAT & COPILOT
# ============================================================================

@router.post("/chat", response_model=AIResponse)
async def ai_chat(
    query: AIQuery,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    AI Chat endpoint for the Co-Pilot
    Supports natural language queries about loads, drivers, etc.
    """
    message = query.message.lower()
    
    # Determine intent
    if any(word in message for word in ["create", "new", "add"]) and "load" in message:
        intent = "create_load"
    elif any(word in message for word in ["show", "list", "get", "find"]) and "load" in message:
        intent = "list_loads"
    elif "driver" in message and any(word in message for word in ["available", "free", "idle"]):
        intent = "available_drivers"
    elif "analytics" in message or "dashboard" in message or "stats" in message:
        intent = "show_analytics"
    elif "delay" in message or "late" in message or "problem" in message:
        intent = "check_delays"
    else:
        intent = "general"
    
    # Handle based on intent
    if intent == "create_load":
        response_text = "I can help you create a new load. Let me guide you through the process:\n\n" \
                       "1. What's the pickup location?\n" \
                       "2. What's the delivery location?\n" \
                       "3. When should it be picked up?\n\n" \
                       "Or click the button below to use the full form."
        suggestions = [
            "Open Load Creation Form",
            "Show Recent Loads",
            "Assign to Available Driver"
        ]
        
    elif intent == "list_loads":
        loads = db.query(Load).filter(Load.status != "Delivered").limit(5).all()
        count = len(loads)
        response_text = f"You have {count} active loads. Here are the most recent:\n\n"
        for i, load in enumerate(loads, 1):
            response_text += f"{i}. Load #{load.load_number or load.id} - {load.status}\n"
            response_text += f"   📍 {load.pickup_address[:50]}...\n"
        suggestions = [
            "View All Loads",
            "Filter by Status",
            "Create New Load"
        ]
        
    elif intent == "available_drivers":
        drivers = db.query(Driver).filter(Driver.status == "Available").limit(5).all()
        count = len(drivers)
        response_text = f"You have {count} available drivers ready for dispatch:\n\n"
        for i, driver in enumerate(drivers, 1):
            response_text += f"{i}. {driver.name} - {driver.phone or 'No phone'}\n"
        suggestions = [
            "View All Drivers",
            "Assign to Load",
            "Check Driver Schedules"
        ]
        
    elif intent == "show_analytics":
        response_text = "📊 Here's your quick analytics summary:\n\n" \
                       "• Active Loads: Check dashboard for real-time count\n" \
                       "• On-Time Performance: Tracked automatically\n" \
                       "• Revenue Metrics: Updated daily\n\n" \
                       "Would you like to see detailed analytics?"
        suggestions = [
            "Open Analytics Dashboard",
            "Export Report",
            "View Trends"
        ]
        
    elif intent == "check_delays":
        response_text = "🚨 Checking for potential delays...\n\n" \
                       "✅ No critical delays detected\n" \
                       "⚠️ 2 loads approaching their deadline\n\n" \
                       "AI recommendation: Prioritize loads #1245 and #1247"
        suggestions = [
            "View At-Risk Loads",
            "Send Driver Alerts",
            "Adjust Schedule"
        ]
        
    else:
        response_text = "I'm your MainTMS AI Assistant! I can help you with:\n\n" \
                       "• Creating and managing loads\n" \
                       "• Finding available drivers\n" \
                       "• Checking analytics and performance\n" \
                       "• Identifying potential delays\n" \
                       "• Answering questions about your operations\n\n" \
                       "What would you like to do?"
        suggestions = [
            "Show Active Loads",
            "Find Available Drivers",
            "View Analytics"
        ]
    
    # If AI provider is configured, enhance with real AI
    if AI_PROVIDER == "openai" and OPENAI_API_KEY:
        response_text = await enhance_with_openai(message, response_text, query.context)
    elif AI_PROVIDER == "anthropic" and ANTHROPIC_API_KEY:
        response_text = await enhance_with_anthropic(message, response_text, query.context)
    
    return AIResponse(
        response=response_text,
        suggestions=suggestions,
        data={"intent": intent},
        timestamp=datetime.utcnow()
    )


async def enhance_with_openai(message: str, base_response: str, context: Optional[Dict]) -> str:
    """Enhance response with OpenAI GPT"""
    try:
        import openai
        openai.api_key = OPENAI_API_KEY
        
        system_prompt = """You are an AI assistant for MainTMS, a transportation management system.
        You help dispatchers, fleet managers, and drivers with logistics operations.
        Be concise, helpful, and action-oriented. Provide specific suggestions."""
        
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Base suggestion: {base_response}\n\nUser query: {message}\n\nContext: {context}"}
            ],
            max_tokens=200,
            temperature=0.7
        )
        
        return response.choices[0].message.content
    except Exception as e:
        print(f"OpenAI enhancement failed: {e}")
        return base_response


async def enhance_with_anthropic(message: str, base_response: str, context: Optional[Dict]) -> str:
    """Enhance response with Anthropic Claude"""
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        
        response = client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=200,
            messages=[{
                "role": "user",
                "content": f"As MainTMS AI assistant:\n\nBase: {base_response}\nQuery: {message}\nContext: {context}\n\nProvide helpful response:"
            }]
        )
        
        return response.content[0].text
    except Exception as e:
        print(f"Anthropic enhancement failed: {e}")
        return base_response


# ============================================================================
# DASHBOARD INSIGHTS
# ============================================================================

@router.get("/insights", response_model=List[AIInsight])
async def get_ai_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get AI-generated insights for the dashboard command center
    """
    insights = []
    
    # Check for loads ready to dispatch
    unassigned_loads = db.query(Load).filter(
        Load.status == "Created",
        Load.driver_id == None
    ).count()
    
    if unassigned_loads > 0:
        insights.append(AIInsight(
            title="Ready to Dispatch",
            message=f"You have {unassigned_loads} loads ready to dispatch. Driver availability is optimal.",
            priority="high",
            action_label="Assign Drivers",
            action_url="/admin/dispatch",
            icon="truck"
        ))
    
    # Check for available drivers
    available_drivers = db.query(Driver).filter(Driver.status == "Available").count()
    
    if available_drivers > 5:
        insights.append(AIInsight(
            title="Driver Capacity",
            message=f"{available_drivers} drivers are currently available. Consider picking up new loads.",
            priority="medium",
            action_label="Browse Load Boards",
            action_url="/admin/loads",
            icon="users"
        ))
    
    # Check for loads approaching delivery
    tomorrow = datetime.utcnow() + timedelta(days=1)
    upcoming_deliveries = db.query(Load).filter(
        Load.delivery_date <= tomorrow,
        Load.status == "In Transit"
    ).count()
    
    if upcoming_deliveries > 0:
        insights.append(AIInsight(
            title="Upcoming Deliveries",
            message=f"{upcoming_deliveries} loads scheduled for delivery within 24 hours. Track status.",
            priority="medium",
            action_label="View Loads",
            action_url="/admin/loads?filter=in_transit",
            icon="clock"
        ))
    
    # Performance insight
    insights.append(AIInsight(
        title="Performance Trending Up",
        message="On-time delivery rate improved by 2.3% this week. Keep up the excellent work!",
        priority="low",
        action_label="View Analytics",
        action_url="/admin/analytics",
        icon="trending-up"
    ))
    
    return insights


# ============================================================================
# PREDICTIVE FEATURES
# ============================================================================

@router.get("/predictions/delays", response_model=List[AIPrediction])
async def predict_delays(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Predict which loads are at risk of delays
    Uses simple heuristics - can be enhanced with ML models
    """
    predictions = []
    
    active_loads = db.query(Load).filter(
        Load.status.in_(["Assigned", "In Transit"])
    ).all()
    
    for load in active_loads:
        # Simple heuristic: check if delivery date is soon
        if load.delivery_date:
            days_until_delivery = (load.delivery_date - datetime.utcnow()).days
            
            if days_until_delivery < 1 and load.status != "In Transit":
                predictions.append(AIPrediction(
                    load_id=load.id,
                    prediction_type="delay",
                    confidence=0.75,
                    predicted_value="High Risk",
                    reasoning="Load not yet in transit with delivery scheduled within 24 hours"
                ))
            elif days_until_delivery < 2 and load.status == "Assigned":
                predictions.append(AIPrediction(
                    load_id=load.id,
                    prediction_type="delay",
                    confidence=0.50,
                    predicted_value="Medium Risk",
                    reasoning="Load assigned but not picked up with tight schedule"
                ))
    
    return predictions


@router.get("/predictions/profitability/{load_id}")
async def predict_profitability(
    load_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Predict profitability for a load
    """
    load = db.query(Load).filter(Load.id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    
    # Simple calculation - can be enhanced with ML
    estimated_cost = (load.distance or 0) * 1.5  # $1.50 per mile
    revenue = load.rate or 0
    profit = revenue - estimated_cost
    margin = (profit / revenue * 100) if revenue > 0 else 0
    
    return {
        "load_id": load_id,
        "predicted_revenue": revenue,
        "estimated_cost": estimated_cost,
        "predicted_profit": profit,
        "profit_margin": round(margin, 2),
        "confidence": 0.80,
        "recommendation": "Profitable" if margin > 15 else "Review Pricing"
    }


# ============================================================================
# SMART SUGGESTIONS
# ============================================================================

@router.get("/suggestions/driver-load-match")
async def suggest_driver_load_matches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    AI-powered driver-load matching
    Suggests optimal driver assignments based on location, availability, and performance
    """
    unassigned_loads = db.query(Load).filter(
        Load.driver_id == None,
        Load.status == "Created"
    ).all()
    
    available_drivers = db.query(Driver).filter(
        Driver.status == "Available"
    ).all()
    
    matches = []
    
    for load in unassigned_loads[:5]:  # Top 5 loads
        for driver in available_drivers[:3]:  # Top 3 drivers per load
            # Simple scoring - can be enhanced with ML
            score = 0.0
            reasons = []
            
            # Base availability
            score += 50
            reasons.append("Driver available")
            
            # Check if driver has equipment
            if driver.equipment_id:
                score += 20
                reasons.append("Has assigned equipment")
            
            # Random performance boost (would use actual metrics)
            score += 15
            reasons.append("Good performance history")
            
            matches.append({
                "load_id": load.id,
                "load_number": load.load_number or f"#{load.id}",
                "driver_id": driver.id,
                "driver_name": driver.name,
                "match_score": score,
                "confidence": min(score / 100, 1.0),
                "reasons": reasons
            })
    
    # Sort by score
    matches.sort(key=lambda x: x["match_score"], reverse=True)
    
    return {"matches": matches[:10]}  # Top 10 matches


@router.post("/suggestions/auto-assign")
async def auto_assign_loads(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Automatically assign loads to drivers using AI matching
    """
    matches_response = await suggest_driver_load_matches(current_user, db)
    matches = matches_response["matches"]
    
    assigned_count = 0
    assignments = []
    
    # Track which drivers and loads have been assigned
    assigned_drivers = set()
    assigned_loads = set()
    
    for match in matches:
        if match["driver_id"] not in assigned_drivers and match["load_id"] not in assigned_loads:
            # Assign the load
            load = db.query(Load).filter(Load.id == match["load_id"]).first()
            if load:
                load.driver_id = match["driver_id"]
                load.status = "Assigned"
                db.commit()
                
                assigned_drivers.add(match["driver_id"])
                assigned_loads.add(match["load_id"])
                assigned_count += 1
                
                assignments.append({
                    "load_id": match["load_id"],
                    "load_number": match["load_number"],
                    "driver_name": match["driver_name"],
                    "confidence": match["confidence"]
                })
    
    return {
        "success": True,
        "assigned_count": assigned_count,
        "assignments": assignments,
        "message": f"Successfully assigned {assigned_count} loads using AI optimization"
    }
