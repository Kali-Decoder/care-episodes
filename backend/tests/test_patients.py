import patients


def test_three_profiles_present():
    ids = {p["patient_id"] for p in patients.list_profiles()}
    assert ids == {"demo-patient-01", "neeraj", "rakesh"}


def test_profile_shape():
    p = patients.list_profiles()[0]
    assert set(p) == {"patient_id", "name", "city", "scenario"}


def test_location_for_known_and_unknown():
    assert patients.location_for("neeraj") == (24.5854, 73.7125)
    # unknown falls back to the default location, never errors
    assert patients.location_for("nobody") == patients.DEFAULT_LOCATION


def test_name_and_exists():
    assert patients.name_for("demo-patient-01") == "Shashank Shekhar"
    assert patients.exists("rakesh") is True
    assert patients.exists("nobody") is False
