let cartReducer = (state = [], action) =>{
    switch (action.type) {
        case 'ADD_TO_CART': {
            return [...state, action.payload]
        }
        case 'REMOVE_FROM_CARD': {
            var idx = state.findIndex((food) => food.id === action.payload)
            return [...state.slice(0, idx), ...state.slice(idx + 1)]
        }
        case 'UPDATE_FROM_CARD': {
            var idx = state.findIndex((food) => food.id === action.payload.id)
            return [...state.slice(0, idx), action.payload,...state.slice(idx + 1)]
        }
        case 'CLEAR_RESTAURANT':
            return state.filter(item => item.restaurantName !== action.payload)
        case 'CLEAR':
            return []
        default:
            return state
    } 
};
export default cartReducer; 