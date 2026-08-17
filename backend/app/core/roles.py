from enum import Enum
from typing import List


class Role(str, Enum):
    ADMIN = "Admin"
    OPERATOR = "Operator"
    ENGINEER = "Engineer"
    VIEWER = "Viewer"


# Role hierarchy map
ROLE_HIERARCHY = {
    Role.ADMIN: [Role.ADMIN, Role.OPERATOR, Role.ENGINEER, Role.VIEWER],
    Role.OPERATOR: [Role.OPERATOR, Role.VIEWER],
    Role.ENGINEER: [Role.ENGINEER, Role.VIEWER],
    Role.VIEWER: [Role.VIEWER],
}
