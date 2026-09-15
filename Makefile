.PHONY: bootstrap env-check test quality

bootstrap:
	npm ci

env-check:
	python3 scripts/check-environment.py

test:
	npm test
	npm run test:gates

quality: env-check test
