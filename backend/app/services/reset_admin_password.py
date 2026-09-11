from getpass import getpass

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.role import Role
from app.models.user import User


def reset_admin_password():
    db = SessionLocal()

    try:
        user = (
            db.query(User)
            .filter(User.username == "admin")
            .first()
        )

        if not user:
            print("Không tìm thấy tài khoản admin.")
            return

        admin_role = (
            db.query(Role)
            .filter(Role.name == "admin")
            .first()
        )

        if not admin_role:
            print("Không tìm thấy role admin.")
            return

        print("Tài khoản tìm thấy:")
        print(f"ID       : {user.id}")
        print(f"Username : {user.username}")
        print(f"Email    : {user.email}")
        print(f"Họ tên   : {user.full_name}")
        print(f"Role     : {admin_role.name}")
        print()

        password = getpass("Mật khẩu mới: ")
        confirm_password = getpass("Nhập lại mật khẩu mới: ")

        if not password:
            print("Mật khẩu không được để trống.")
            return

        if password != confirm_password:
            print("Mật khẩu nhập lại không khớp.")
            return

        user.password_hash = hash_password(password)
        user.role_id = admin_role.id
        user.is_active = True

        db.commit()
        db.refresh(user)

        print()
        print("========================================")
        print("RESET ADMIN THÀNH CÔNG")
        print("========================================")
        print(f"Username : {user.username}")
        print(f"Email    : {user.email}")
        print(f"Role     : {admin_role.name}")
        print(f"Active   : {user.is_active}")
        print("========================================")

    except Exception as exc:
        db.rollback()
        print(f"Lỗi: {exc}")

    finally:
        db.close()


if __name__ == "__main__":
    reset_admin_password()