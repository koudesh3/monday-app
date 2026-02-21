export default function OrderForm() {
    return <div>OrderForm</div>;
}

// boardId must be sourced from monday.get('context').boardId on the frontend and included in the
// request body. The monday SDK scopes this to the board the app is currently installed on,
// so it reflects the correct board for the current tenant without any additional validation.