# Archived legacy neural/fusion prototype

**Status: historical and non-production. Do not deploy, import, train, or expose this material from the ZivaDzidzo runtime.**

This directory preserves the exploratory neural-network, model-fusion, notebooks, raw benchmark data, generated artifacts, and retired HTTP/service/test code that existed before ZivaDzidzo adopted its current LLM-native product boundary.

It is retained only for provenance and later research review:

- `models/` contains the former generated Industry 4.0 artifacts.
- `notebooks/` contains the former experiment and training workflow.
- `raw/` contains the source datasets used by that experiment on the local machine. It is intentionally Git-ignored so learner-like source files are not distributed with the active repository. Those files must not be copied into production, sent to an LLM, or treated as Zimbabwean school data.
- `retired-api/` contains the unmounted route, service, and test that once read those artifacts.

The production Express server does **not** mount this route or import anything in this directory. Current assessment workflows use provider-backed structured LLM outputs and their server-side validation/calculation logic; they never fall back to these archived artifacts.

If this work is revisited, create a separately governed research project with documented data rights, privacy review, evaluation, and an explicit deployment decision. Moving a file back into `backend/` is not authorization to use it in production.
