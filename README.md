# Monday.com Take Home Assessment

This is a full-stack app built to streamline order processing & production for a candle company 🕯️

## Stack
- **Language**: Node.js + TypeScript
- **Frontend**: React (using Monday's Vibe UI Components), built with esbuild
- **Backend**: Hono API
- **Testing**: Vitest

## What It Does
- Order form for setting up candle gift boxes
- Fragrance form and API for creating/editing candle fragrances
- Webhook endpoint for handling order status rollup from its order lines

## Out of Scope
- Production build for Monday app marketplace deployment
- Automatic board setup (currently requires manual config for a specific board, mimicking a one off demo for a single customer)

## Deploying the app
1. Install and build:
    ```bash
    npm install && npm run build
    ```
2. Set up the Monday CLI with an API token from the developer center

3. Set environment variables:
    ```
    MONDAY_API_TOKEN="123"
    MONDAY_CLIENT_SECRET="abc"
    ```
4. Create a new app in Monday.com and deploy the backend:
    ```bash
    mapps code:push
    ```
5. Deploy the frontend:
    ```bash
    npm run build && cd dist/client && mapps code:push --client-side
    ```
6. Set up a webhook integration pointing to `{YOUR_SERVER_URL}/webhook`, with the trigger "When **subitem Status** changes to **anything**, send a webhook"