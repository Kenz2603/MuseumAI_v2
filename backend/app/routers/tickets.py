from datetime import date
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user,
    require_roles,
)
from app.models.exhibition import Exhibition
from app.models.ticket import Ticket
from app.models.user import User
from app.models.visitor import Visitor
from app.schemas.ticket import (
    TICKET_PRICES,
    TicketCreate,
    TicketManagementResponse,
    TicketPurchase,
    TicketResponse,
    TicketUpdate,
)

router = APIRouter(
    prefix="/api/tickets",
    tags=["Tickets"],
)


# ============================================================
# HELPER - KIỂM TRA LOẠI VÉ VÀ TÍNH GIÁ
# ============================================================

def get_ticket_price(ticket_type: str):
    price = TICKET_PRICES.get(ticket_type)

    if price is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Loại vé không hợp lệ. "
                "Chỉ chấp nhận: normal, student, child."
            ),
        )

    return price


# ============================================================
# HELPER - KIỂM TRA TRIỂN LÃM
# ============================================================

def validate_exhibition(
    db: Session,
    exhibition_id: int,
    visit_date: date,
) -> Exhibition:
    exhibition = (
        db.query(Exhibition)
        .filter(
            Exhibition.id == exhibition_id,
        )
        .first()
    )

    if not exhibition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy triển lãm",
        )

    if not exhibition.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Triển lãm đã ngừng hoạt động",
        )

    start_date = exhibition.start_date.date()
    end_date = exhibition.end_date.date()

    if visit_date < start_date or visit_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Ngày tham quan phải nằm trong thời gian "
                "diễn ra triển lãm"
            ),
        )

    return exhibition


# ============================================================
# HELPER - KIỂM TRA KHÁCH THAM QUAN
# ============================================================

def validate_visitor(
    db: Session,
    visitor_id: int,
) -> Visitor:
    visitor = (
        db.query(Visitor)
        .filter(
            Visitor.id == visitor_id,
        )
        .first()
    )

    if not visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy khách tham quan",
        )

    if not visitor.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Khách tham quan đã bị khóa",
        )

    return visitor


# ============================================================
# HELPER - SINH MÃ VÉ
# ============================================================

def generate_ticket_code(
    db: Session,
) -> str:
    while True:
        code = f"TKT-{uuid4().hex[:8].upper()}"

        existing = (
            db.query(Ticket)
            .filter(
                Ticket.ticket_code == code,
            )
            .first()
        )

        if not existing:
            return code


# ============================================================
# CREATE TICKET
# ADMIN / TICKET STAFF
#
# Backend tự tính price theo ticket_type.
# ============================================================

@router.post(
    "",
    response_model=TicketResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_ticket(
    data: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "ticket_staff",
        )
    ),
):
    existing_ticket = (
        db.query(Ticket)
        .filter(
            Ticket.ticket_code == data.ticket_code,
        )
        .first()
    )

    if existing_ticket:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã vé đã tồn tại",
        )

    validate_visitor(
        db,
        data.visitor_id,
    )

    validate_exhibition(
        db,
        data.exhibition_id,
        data.visit_date,
    )

    price = get_ticket_price(
        data.ticket_type,
    )

    ticket = Ticket(
        ticket_code=data.ticket_code,
        visitor_id=data.visitor_id,
        exhibition_id=data.exhibition_id,
        ticket_type=data.ticket_type,
        price=price,
        visit_date=data.visit_date,
        status=data.status,
        notes=data.notes,
        is_active=True,
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return ticket


# ============================================================
# PURCHASE TICKET
# USER ĐÃ ĐĂNG NHẬP
#
# Backend tự:
# - tìm visitor
# - sinh ticket_code
# - xác định price
# - đặt status = valid
# ============================================================

@router.post(
    "/purchase",
    response_model=TicketResponse,
    status_code=status.HTTP_201_CREATED,
)
def purchase_ticket(
    data: TicketPurchase,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user,
    ),
):
    visitor = (
        db.query(Visitor)
        .filter(
            Visitor.user_id == current_user.id,
        )
        .first()
    )

    if not visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Tài khoản chưa có hồ sơ "
                "khách tham quan. "
                "Vui lòng cập nhật hồ sơ "
                "trước khi đặt vé."
            ),
        )

    if not visitor.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hồ sơ khách tham quan đã bị khóa",
        )

    exhibition = validate_exhibition(
        db,
        data.exhibition_id,
        data.visit_date,
    )

    price = get_ticket_price(
        data.ticket_type,
    )

    ticket_code = generate_ticket_code(db)

    ticket = Ticket(
        ticket_code=ticket_code,
        visitor_id=visitor.id,
        exhibition_id=exhibition.id,
        ticket_type=data.ticket_type,
        price=price,
        visit_date=data.visit_date,
        status="valid",
        notes=data.notes,
        is_active=True,
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return ticket


# ============================================================
# GET MY TICKETS
# USER ĐÃ ĐĂNG NHẬP
# ============================================================

@router.get(
    "/my",
    response_model=list[TicketResponse],
)
def get_my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user,
    ),
):
    visitor = (
        db.query(Visitor)
        .filter(
            Visitor.user_id == current_user.id,
        )
        .first()
    )

    if not visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy hồ sơ khách tham quan",
        )

    return (
        db.query(Ticket)
        .filter(
            Ticket.visitor_id == visitor.id,
        )
        .order_by(
            Ticket.created_at.desc(),
        )
        .all()
    )


# ============================================================
# GET TICKETS
# ADMIN / TICKET STAFF
# ============================================================

@router.get(
    "",
    response_model=list[TicketManagementResponse],
)
def get_tickets(
    skip: int = Query(
        default=0,
        ge=0,
    ),
    limit: int = Query(
        default=100,
        ge=1,
        le=100,
    ),
    search: str | None = Query(
        default=None,
        description="Tìm theo mã vé",
    ),
    visitor_id: int | None = Query(
        default=None,
        gt=0,
    ),
    exhibition_id: int | None = Query(
        default=None,
        gt=0,
    ),
    ticket_status: str | None = Query(
        default=None,
        alias="status",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "ticket_staff",
        )
    ),
):
    query = (
        db.query(
            Ticket,
            Visitor.full_name.label("visitor_name"),
            Visitor.email.label("visitor_email"),
            Exhibition.name.label("exhibition_name"),
        )
        .join(
            Visitor,
            Ticket.visitor_id == Visitor.id,
        )
        .join(
            Exhibition,
            Ticket.exhibition_id == Exhibition.id,
        )
    )

    if search:
        query = query.filter(
            Ticket.ticket_code.ilike(
                f"%{search.strip()}%",
            )
        )

    if visitor_id is not None:
        query = query.filter(
            Ticket.visitor_id == visitor_id,
        )

    if exhibition_id is not None:
        query = query.filter(
            Ticket.exhibition_id == exhibition_id,
        )

    if ticket_status is not None:
        query = query.filter(
            Ticket.status == ticket_status,
        )

    rows = (
        query
        .order_by(
            Ticket.created_at.desc(),
        )
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        TicketManagementResponse(
            id=ticket.id,
            ticket_code=ticket.ticket_code,
            visitor_id=ticket.visitor_id,
            visitor_name=visitor_name,
            visitor_email=visitor_email,
            exhibition_id=ticket.exhibition_id,
            exhibition_name=exhibition_name,
            ticket_type=ticket.ticket_type,
            price=ticket.price,
            visit_date=ticket.visit_date,
            status=ticket.status,
            notes=ticket.notes,
            is_active=ticket.is_active,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
        )
        for (
            ticket,
            visitor_name,
            visitor_email,
            exhibition_name,
        ) in rows
    ]


# ============================================================
# GET TICKET BY ID
# ADMIN / TICKET STAFF
# ============================================================

@router.get(
    "/{ticket_id}",
    response_model=TicketResponse,
)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "ticket_staff",
        )
    ),
):
    ticket = (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id,
        )
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy vé",
        )

    return ticket


# ============================================================
# UPDATE TICKET
# ADMIN / TICKET STAFF
#
# Không nhận price từ client.
# Khi ticket_type thay đổi -> tự tính lại price.
# ============================================================

@router.put(
    "/{ticket_id}",
    response_model=TicketResponse,
)
def update_ticket(
    ticket_id: int,
    data: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "ticket_staff",
        )
    ),
):
    ticket = (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id,
        )
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy vé",
        )

    if data.ticket_code is not None:
        existing_ticket = (
            db.query(Ticket)
            .filter(
                Ticket.ticket_code == data.ticket_code,
                Ticket.id != ticket.id,
            )
            .first()
        )

        if existing_ticket:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã vé đã tồn tại",
            )

        ticket.ticket_code = data.ticket_code

    if data.visitor_id is not None:
        validate_visitor(
            db,
            data.visitor_id,
        )

        ticket.visitor_id = data.visitor_id

    new_exhibition_id = (
        data.exhibition_id
        if data.exhibition_id is not None
        else ticket.exhibition_id
    )

    new_visit_date = (
        data.visit_date
        if data.visit_date is not None
        else ticket.visit_date
    )

    validate_exhibition(
        db,
        new_exhibition_id,
        new_visit_date,
    )

    ticket.exhibition_id = new_exhibition_id
    ticket.visit_date = new_visit_date

    if data.ticket_type is not None:
        ticket.ticket_type = data.ticket_type
        ticket.price = get_ticket_price(
            data.ticket_type,
        )

    if data.status is not None:
        ticket.status = data.status

    if data.notes is not None:
        ticket.notes = data.notes

    if data.is_active is not None:
        ticket.is_active = data.is_active

    db.commit()
    db.refresh(ticket)

    return ticket


# ============================================================
# DELETE / DEACTIVATE TICKET
# ADMIN / TICKET STAFF
#
# Soft delete:
# - is_active = False
# - status = cancelled
# ============================================================

@router.delete(
    "/{ticket_id}",
    response_model=TicketResponse,
)
def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "ticket_staff",
        )
    ),
):
    ticket = (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id,
        )
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy vé",
        )

    ticket.is_active = False
    ticket.status = "cancelled"

    db.commit()
    db.refresh(ticket)

    return ticket