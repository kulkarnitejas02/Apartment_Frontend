from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi import Cookie
from fastapi.responses import FileResponse
from fastapi.templating import Jinja2Templates
from fastapi import Depends
from fastapi import Response
from sqlalchemy.orm import Session
from sqlalchemy.engine import reflection
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi import Request
from src import models, schemas, database, expense
from src.expense import router as expense_router
from src.income import router as income_router
from src.income_records import router as income_records_router
from src.expense_records import router as expense_records_router
from src.dependencies import get_db, get_current_user
from src.models import Base
from src.database import SessionLocal, engine
import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()
app.include_router(expense_router)
app.include_router(income_router)
app.include_router(income_records_router)
app.include_router(expense_records_router)

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=database.engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://societymanagementweb.netlify.app",  # Your production frontend
        "https://tear-luggage-invitations-bytes.trycloudflare.com",
        "http://localhost:8000",  # For local testing (if needed)
        "http://127.0.0.1:8000"   # For local testing (if needed)
    ],
    allow_credentials=True,  # This is already correct - keeps cookies working
    allow_methods=["*"],
    allow_headers=["*"],
)


# Serve static frontend
if os.path.isdir("static"):
    app.mount("/static", StaticFiles(directory="static", html=True), name="static")

# Serve template files if exists
if os.path.isdir("template"):
    app.mount("/template", StaticFiles(directory="template", html=True), name="static")

@app.get('/')
def read_index():
    return FileResponse(os.path.join("index.html"))

@app.get("/me")
def get_me(session: models.User = Depends(get_current_user)):
    return {"name": session.name,
             "role": session.role, 
             "username":session.username, 
             #"userid": session.id, 
             "flat_number": session.flat_number,
}

@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return [{"flat_number": user.flat_number, "name": user.name, "role": user.role} for user in users]

@app.post("/register", response_model=schemas.UserOut)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        print("Received user data:", user.dict())
        existing_user = db.query(models.User).filter(models.User.username == user.username).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")

        new_user = models.User(**user.dict())
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except Exception as e:
        print(f"Error during registration: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
def login(login_req: schemas.LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.username == login_req.username,
        models.User.password == login_req.password
    ).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Set cookie on the response object
    response.set_cookie(
        key="session", 
        value=user.username, 
        httponly=True,
        secure=True,  # Required for SameSite=None
        samesite="none",  # Use lowercase "none" for cross-origin
        max_age=1800  # 30 minutes
    )
    
    # Return the JSON data directly
    return {
        "message": f"Welcome {user.name}!",
        "name": user.name,
        "role": user.role,
    }


templates = Jinja2Templates(directory="templates")

@app.get("/dashboard")
def dashboard(request: Request, session: str = Depends(get_current_user)):
    # session is verified by get_current_user
    return templates.TemplateResponse(
        "dashboard.html",
        {"request": request, "user": session}
    )

@app.get("/dashboard/expenses", response_class=HTMLResponse)
def show_expenses(request: Request, session: str = Depends(get_current_user)):
    # session is verified by get_current_user
    return templates.TemplateResponse(
        "expense.html",
        {"request": request, "user": session}
    )

@app.get("/dashboard/income", response_class=HTMLResponse)
def show_income(request: Request, session: str = Depends(get_current_user)):
    # session is verified by get_current_user
    return templates.TemplateResponse(
        "income.html",
        {"request": request, "user": session}
    )

@app.get("/dashboard/income_records", response_class=HTMLResponse)
def show_income_records(request: Request, session: str = Depends(get_current_user)):
    # session is verified by get_current_user
    return templates.TemplateResponse(
        "income_records.html",
        {"request": request, "user": session}
    )

@app.get("/dashboard/expense_records", response_class=HTMLResponse)
def show_expense_records(request: Request, session: str = Depends(get_current_user)):
    # session is verified by get_current_user
    return templates.TemplateResponse(
        "expense_records.html",
        {"request": request, "user": session}
    )

@app.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="session",
        secure=True,
        samesite="none"  # Must match the cookie settings
    )
    return {"message": "Logged out successfully"}


@app.put("/reset-password")
def reset_password(reset_req: dict, db: Session = Depends(get_db)):
    username = reset_req.get("username")
    contact_id = reset_req.get("contact_id") 
    new_password = reset_req.get("new_password")
    
    if not all([username, contact_id, new_password]):
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    # Find user by username and contact_id to verify identity
    user = db.query(models.User).filter(
        models.User.username == username,
        models.User.contact_id == contact_id
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found or invalid contact ID")
    
    # Update the password
    try:
        user.password = new_password
        db.commit()
        return {"message": "Password reset successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to reset password")


