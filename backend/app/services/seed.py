from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.role import Role
from app.models.user import User

DEFAULT_ROLES = [
    {
        "name": "admin",
        "description": "Quản trị viên hệ thống",
    },
    {
        "name": "content_staff",
        "description": "Nhân viên quản lý nội dung",
    },
    {
        "name": "ticket_staff",
        "description": "Nhân viên bán và quản lý vé",
    },
    {
        "name": "visitor",
        "description": "Khách tham quan",
    },
]


def seed_roles(db: Session):
    for role_data in DEFAULT_ROLES:

        existing_role = (
            db.query(Role)
            .filter(Role.name == role_data["name"])
            .first()
        )

        if existing_role:
            continue

        db.add(
            Role(
                name=role_data["name"],
                description=role_data["description"],
            )
        )

    db.commit()


def seed_admin(db: Session):
    existing_admin = (
        db.query(User)
        .filter(User.username == "admin")
        .first()
    )

    if existing_admin:
        return

    admin_role = (
        db.query(Role)
        .filter(Role.name == "admin")
        .first()
    )

    if not admin_role:
        raise RuntimeError(
            "Không tìm thấy role admin."
        )

    admin = User(
        username="admin",
        email="admin@museumai.com",
        full_name="Quản trị viên",
        password_hash=hash_password("Admin@123456"),
        role_id=admin_role.id,
        is_active=True,
    )

    db.add(admin)
    db.commit()