"""Pure mapping tests for the intake agent — no Gemini call, no cost."""

from agents.intake import Extraction, to_prescription


def test_to_prescription_maps_all_fields():
    x = Extraction(
        readable=True,
        doctor="Dr. Ranajit Dutta",
        date="2017-03-17",
        diagnosis="Ac. Rhino Sinusitis",
        medicines=[{"name": "Sinarest", "dose": "1 tab", "frequency": "BD x 3 days"}],
        tests=[{"test_code": "TSH", "display_name": "Thyroid Stimulating Hormone",
                "urgency": "routine"}],
    )
    p = to_prescription(x, source_file_url="file:///rx.heic")
    assert p.doctor == "Dr. Ranajit Dutta"
    assert p.date == "2017-03-17"
    assert p.diagnosis == "Ac. Rhino Sinusitis"
    assert p.source_file_url == "file:///rx.heic"
    assert p.medicines[0].frequency == "BD x 3 days"
    assert p.tests[0].test_code == "TSH"
    # The intake-only `readable` flag must not leak into the contract model.
    assert not hasattr(p, "readable")


def test_to_prescription_handles_empty_extraction():
    p = to_prescription(Extraction(readable=False))
    assert p.medicines == []
    assert p.tests == []
    assert p.doctor == ""
    assert p.source_file_url is None
