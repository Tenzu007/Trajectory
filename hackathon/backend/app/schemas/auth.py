from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator

class LoginRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    username_or_email: Optional[str] = Field(default=None, alias="usernameOrEmail")
    email: Optional[str] = None
    username: Optional[str] = None
    password: str
    role: Optional[str] = None

    @model_validator(mode='after')
    def resolve_username_or_email(self):
        if not self.username_or_email:
            self.username_or_email = self.email or self.username
        if not self.username_or_email:
            raise ValueError("username_or_email, email, or username is required")
        return self

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    username: str
    full_name: str

class UserCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    username: Optional[str] = None
    email: str
    password: str
    full_name: Optional[str] = Field(default=None, alias="name")
    role: str = "staff"
    department: Optional[str] = None

    @model_validator(mode='after')
    def resolve_names(self):
        if not self.username:
            self.username = self.email
        if not self.full_name:
            self.full_name = self.username.split("@")[0].capitalize()
        return self

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    department: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True
