"""Manual login check. Not a pytest module: run with `python test_auth.py`."""
import requests


def main():
    print("Attempting to hit protected endpoint without token...")
    res1 = requests.get("http://localhost:8000/api/v1/admin/district/escalations")
    print("Response:", res1.status_code, res1.text)

    print("\nLogging in as admin...")
    login_res = requests.post(
        "http://localhost:8000/api/v1/auth/login",
        data={"username": "admin", "password": "password123"},
    )
    print("Login status:", login_res.status_code)
    if login_res.status_code == 200:
        token = login_res.json()["access_token"]
        print("Token obtained successfully.")

        print("\nAttempting to hit protected endpoint WITH token...")
        res2 = requests.get(
            "http://localhost:8000/api/v1/admin/district/escalations",
            headers={"Authorization": f"Bearer {token}"},
        )
        print("Response:", res2.status_code)
    else:
        print(login_res.text)


if __name__ == "__main__":
    main()
