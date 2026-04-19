from jsonschema import validate, ValidationError
from typing import Dict, Any

# We'll use a more permissive schema to avoid 400 errors when adding new props
# The frontend is responsible for the registry and UI, the backend just ensures basic structure
BLOCK_SCHEMAS = {
    "heading": {
        "type": "object",
        "additionalProperties": True
    },
    "text": {
        "type": "object",
        "additionalProperties": True
    },
    "image": {
        "type": "object",
        "additionalProperties": True
    },
    "button": {
        "type": "object",
        "additionalProperties": True
    },
    "section": {
        "type": "object",
        "additionalProperties": True
    },
    "columns": {
        "type": "object",
        "additionalProperties": True
    },
    "banner": {
        "type": "object",
        "additionalProperties": True
    }
}

def validate_block_tree(node: Dict[str, Any]):
    block_type = node.get("type")
    props = node.get("props", {})
    children = node.get("children", [])
    
    # We validate that props is at least a dictionary if the type is known
    if block_type in BLOCK_SCHEMAS:
        try:
            validate(instance=props, schema=BLOCK_SCHEMAS[block_type])
        except ValidationError as e:
            raise ValueError(f"Invalid props for block '{block_type}': {e.message}")
            
    for child in children:
        validate_block_tree(child)

def validate_page_schema(schema: Dict[str, Any]):
    root = schema.get("root")
    if root:
        validate_block_tree(root)
