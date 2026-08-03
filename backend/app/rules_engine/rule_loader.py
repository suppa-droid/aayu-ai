import os
import yaml
from typing import Dict, Any, List

class RuleLoader:
    def __init__(self, schemes_dir: str = None):
        if schemes_dir is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            schemes_dir = os.path.join(base_dir, "schemes")
        self.schemes_dir = schemes_dir
        self.schemes_cache: Dict[str, Any] = {}
        self.load_all_schemes()

    def load_all_schemes(self) -> Dict[str, Any]:
        if not os.path.exists(self.schemes_dir):
            return {}
            
        for file_name in os.listdir(self.schemes_dir):
            if file_name.endswith(".yaml") or file_name.endswith(".yml"):
                file_path = os.path.join(self.schemes_dir, file_name)
                with open(file_path, "r", encoding="utf-8") as f:
                    scheme_data = yaml.safe_load(f)
                    if scheme_data and "scheme_id" in scheme_data:
                        self.schemes_cache[scheme_data["scheme_id"]] = scheme_data
        return self.schemes_cache

    def get_scheme(self, scheme_id: str) -> Any:
        return self.schemes_cache.get(scheme_id)

    def list_schemes(self) -> List[Any]:
        return list(self.schemes_cache.values())

rule_loader = RuleLoader()
