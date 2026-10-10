"""Money handling: integer paisa everywhere, human display strings at the edge."""
from app.services.money import format_pkr, rupees_to_paisa


def test_rupees_to_paisa_whole():
    assert rupees_to_paisa(5000) == 500000
    assert rupees_to_paisa(0) == 0
    assert rupees_to_paisa(1) == 100


def test_rupees_to_paisa_fractional_rounds_to_integer():
    assert rupees_to_paisa(5000.5) == 500050
    assert rupees_to_paisa(19.99) == 1999
    assert rupees_to_paisa(12345.67) == 1234567


def test_rupees_to_paisa_large():
    assert rupees_to_paisa(1_000_000) == 100_000_000
    assert rupees_to_paisa(2.5) == 250


def test_format_pkr_whole_rupees_no_decimals():
    assert format_pkr(500000) == "Rs 5,000"
    assert format_pkr(0) == "Rs 0"
    assert format_pkr(100) == "Rs 1"
    assert format_pkr(100_000_000) == "Rs 1,000,000"


def test_format_pkr_keeps_paisa_when_present():
    assert format_pkr(500050) == "Rs 5,000.50"
    assert format_pkr(1999) == "Rs 19.99"
    assert format_pkr(123456789) == "Rs 1,234,567.89"


def test_format_round_trip():
    assert format_pkr(rupees_to_paisa(12345.67)) == "Rs 12,345.67"
    assert format_pkr(rupees_to_paisa(9000)) == "Rs 9,000"
