from sqlalchemy import Column, Integer, String, DateTime, JSON, Float, ForeignKey, Boolean, Text, Numeric
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    password_hash = Column(String, nullable=True)  # For email/password auth
    bio = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    company = Column(String, nullable=True)
    location = Column(String, nullable=True)
    website = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    auth_provider = Column(String, default="email")  # email, google, etc.
    email_verified = Column(Boolean, default=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    login_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class UserSession(Base):
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, ForeignKey("users.email"), index=True)
    session_token = Column(String, unique=True, index=True)
    provider = Column(String, default="google")  # google, email, etc.
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    device_info = Column(JSON, nullable=True)  # Browser, OS, Device type
    location_info = Column(JSON, nullable=True)  # Country, City from IP
    login_method = Column(String, default="oauth")  # oauth, email, etc.
    session_start = Column(DateTime(timezone=True), server_default=func.now())
    session_end = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class UserSubscription(Base):
    __tablename__ = "user_subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_email = Column(String, ForeignKey("users.email"), index=True)
    plan_name = Column(String, index=True)  # free, professional, enterprise
    plan_display_name = Column(String)  # Market Explorer, Growth Accelerator, Market Dominator
    billing_cycle = Column(String)  # monthly, yearly
    price = Column(Float)  # Changed to Float for easier JSON serialization
    currency = Column(String, default="INR")
    status = Column(String, default="active")  # active, cancelled, expired, pending
    max_analyses = Column(Integer, default=5)  # -1 for unlimited
    features = Column(JSON)  # Store available features
    subscription_start = Column(DateTime(timezone=True), server_default=func.now())
    subscription_end = Column(DateTime(timezone=True), nullable=True)
    dodo_subscription_id = Column(String, nullable=True)
    dodo_customer_id = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class PaymentHistory(Base):
    __tablename__ = "payment_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_email = Column(String, ForeignKey("users.email"), index=True)
    subscription_id = Column(Integer, ForeignKey("user_subscriptions.id"), nullable=True)
    dodo_payment_id = Column(String, unique=True, index=True, nullable=True)

    amount = Column(Float)
    currency = Column(String, default="INR")
    status = Column(String)  # success, failed, pending, refunded
    payment_method = Column(String, nullable=True)  # card, netbanking, wallet, upi
    plan_name = Column(String)
    billing_cycle = Column(String)
    payment_date = Column(DateTime(timezone=True), server_default=func.now())
    failure_reason = Column(String, nullable=True)
    refund_amount = Column(Numeric(10, 2), nullable=True)
    refund_date = Column(DateTime(timezone=True), nullable=True)
    invoice_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class SearchHistory(Base):
    __tablename__ = "search_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True, nullable=True)
    area = Column(String, index=True)
    analysis = Column(String)
    recommendations = Column(JSON) # Store list of dicts for recommendations
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class BusinessPlan(Base):
    __tablename__ = "business_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    business_title = Column(String)
    area = Column(String)
    plan_data = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Roadmap(Base):
    __tablename__ = "roadmaps"
    
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    title = Column(String)
    area = Column(String)
    roadmap_data = Column(JSON)
    current_step = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class BusinessRecommendation(Base):
    __tablename__ = "business_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    business_name = Column(String, index=True)
    category = Column(String, index=True)
    location = Column(String, index=True, nullable=True)
    startup_cost = Column(String)
    estimated_revenue = Column(String)
    estimated_profit = Column(String)
    demand_score = Column(Float)
    competition_level = Column(String)
    risk_score = Column(String)
    ai_recommendation = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class BusinessReview(Base):
    __tablename__ = "business_reviews"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("business_recommendations.id"))
    user_id = Column(String, index=True)
    rating = Column(Integer)
    review_text = Column(String)
    review_tags = Column(String)
    sentiment_score = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    type = Column(String)  # payment, analysis, profile, system, market, alert
    title = Column(String)
    message = Column(Text)
    priority = Column(String, default="medium")  # low, medium, high, urgent
    read = Column(Boolean, default=False)
    action_url = Column(String, nullable=True)
    notification_metadata = Column(JSON, nullable=True)  # Changed from metadata to notification_metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class SavedBusiness(Base):
    __tablename__ = "saved_businesses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True) # or ForeignKey("users.email")
    business_name = Column(String, index=True)
    category = Column(String, nullable=True)
    location = Column(String, nullable=True)
    details = Column(JSON)  # Store the full recommendation object
    created_at = Column(DateTime(timezone=True), server_default=func.now())
