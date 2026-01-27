from typing import Any, Dict


def ok(payload: Dict[str, Any]) -> Dict[str, Any]:
    return {"ok": True, **payload}
