"""Zestaw przykładowy ZUS: lista spraw, rozpoznanie po odcisku i wybór z listy."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.zus_sample_service import load_samples, recognize

client = TestClient(app)


def test_sample_list_covers_the_whole_set():
    response = client.get("/api/samples")
    assert response.status_code == 200
    samples = response.json()
    assert len(samples) == len(load_samples()) == 87
    assert len({row["id"] for row in samples}) == len(samples)
    assert all(row["title"] and row["facts"] and row["file_name"] for row in samples)


def test_every_sample_has_a_digest_and_duplicates_are_marked():
    samples = load_samples()
    digests = [sample.sha256 for sample in samples]
    assert all(len(digest) == 64 for digest in digests)
    repeated = {digest for digest in digests if digests.count(digest) > 1}
    for digest in repeated:
        copies = [sample for sample in samples if sample.sha256 == digest]
        assert copies[0].duplicate_of is None
        assert all(copy.duplicate_of == copies[0].id for copy in copies[1:])


def test_recognition_returns_the_sample_for_a_known_digest():
    sample = load_samples()[0]
    response = client.post("/api/samples/recognize", json={"sha256": sample.sha256})
    assert response.status_code == 200
    payload = response.json()
    assert payload["matched"] is True
    assert payload["sample"]["id"] == sample.id
    assert payload["sample"]["file_name"] == sample.file_name


def test_unknown_digest_points_to_the_manual_form():
    response = client.post("/api/samples/recognize", json={"sha256": "a" * 64})
    assert response.status_code == 200
    payload = response.json()
    assert payload["matched"] is False
    assert payload["sample"] is None
    assert "formularzu" in payload["hint"]


def test_digest_must_be_a_sha256_hex_string():
    response = client.post("/api/samples/recognize", json={"sha256": "nie-hex"})
    assert response.status_code == 422


def test_sample_endpoint_returns_the_same_record_as_recognition():
    sample = load_samples()[3]
    direct = client.get(f"/api/samples/{sample.id}")
    assert direct.status_code == 200
    matched = client.post("/api/samples/recognize", json={"sha256": sample.sha256}).json()
    assert direct.json() == matched["sample"]


def test_missing_sample_returns_404():
    assert client.get("/api/samples/ZUS-999").status_code == 404


@pytest.mark.parametrize("sample", load_samples(), ids=lambda item: item.id)
def test_sample_has_benefits_and_applicant(sample):
    assert recognize(sample.sha256).matched is True
    assert sample.benefits
    assert sample.applicant.label
    assert sample.applicant.employment in {"employee", "contractor", "self_employed", "none"}
    assert sample.pages > 0
    assert len(sample.facts) > 20