from getpass import getpass

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.role import Role
from app.models.user import User


def create_admin():
    db = SessionLocal()

    try:
        admin_role = (
            db.query(Role)
            .filter(Role.name == "admin")
            .first()
        )

        if not admin_role:
            print("Không tìm thấy role 'admin'.")
            print("Hãy chắc chắn ứng dụng đã khởi động ít nhất một lần.")
            return

        username = input("Username admin: ").strip()
        email = input("Email admin: ").strip()
        full_name = input("Họ tên admin: ").strip()
        password = getpass("Mật khẩu admin: ")
        confirm_password = getpass("Nhập lại mật khẩu: ")

        if not username or not email or not full_name or not password:
            print("Không được để trống thông tin.")
            return

        if password != confirm_password:
            print("Mật khẩu nhập lại không khớp.")
            return

        existing_username = (
            db.query(User)
            .filter(User.username == username)
            .first()
        )

        if existing_username:
            print(f"Username '{username}' đã tồn tại.")
            return

        existing_email = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if existing_email:
            print(f"Email '{email}' đã tồn tại.")
            return

        admin = User(
            username=username,
            email=email,
            full_name=full_name,
            password_hash=hash_password(password),
            role_id=admin_role.id,
            is_active=True,
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print()
        print("========================================")
        print("TẠO TÀI KHOẢN ADMIN THÀNH CÔNG")
        print("========================================")
        print(f"ID       : {admin.id}")
        print(f"Username : {admin.username}")
        print(f"Email    : {admin.email}")
        print(f"Full name: {admin.full_name}")
        print(f"Role     : {admin_role.name}")
        print(f"Active   : {admin.is_active}")
        print("========================================")

    except Exception as exc:
        db.rollback()
        print(f"Lỗi khi tạo tài khoản admin: {exc}")

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()