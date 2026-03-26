"""Hello unit test module."""

from django_api.hello import hello


def test_hello():
    """Test the hello function."""
    assert hello() == "Hello django-api"
