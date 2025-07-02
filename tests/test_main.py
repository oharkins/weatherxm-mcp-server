import pytest
import sys
import os

# Add the project root to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

def test_import_main():
    """Test that main.py can be imported without errors"""
    try:
        import main
        assert main is not None
    except ImportError as e:
        pytest.fail(f"Failed to import main.py: {e}")

def test_smithery_config_exists():
    """Test that smithery.yaml exists and is valid"""
    import yaml
    import os
    
    config_path = os.path.join(os.path.dirname(__file__), '..', 'smithery.yaml')
    assert os.path.exists(config_path), "smithery.yaml file not found"
    
    try:
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
        assert config is not None, "smithery.yaml is empty or invalid"
        assert 'startCommand' in config, "smithery.yaml missing startCommand"
    except yaml.YAMLError as e:
        pytest.fail(f"Invalid YAML in smithery.yaml: {e}")

def test_pyproject_toml_exists():
    """Test that pyproject.toml exists"""
    import os
    
    config_path = os.path.join(os.path.dirname(__file__), '..', 'pyproject.toml')
    assert os.path.exists(config_path), "pyproject.toml file not found" 