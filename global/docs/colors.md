# Colors

Global color palette used across the app. Source: `../colors.js`. All values are in `colors` except where noted.

## Base colors

| Property | Value     | Meaning        |
|----------|-----------|----------------|
| `white`  | `#ffffff` | Pure white     |
| `black`  | `#000000` | Pure black     |

## Grey scale

`colors.grey` is a scale from lightest (50) to near black (900). Use it for borders, disabled states, and secondary text.

| Key  | Value     | Use            |
|------|-----------|----------------|
| `50` | `#f8f9fa` | Lightest       |
| `100`| `#eee`    | Very light     |
| `200`| `#d9d9d9` | Light          |
| `300`| `#ced4da` | Medium         |
| `400`| `#ccc`    | Medium-light   |
| `500`| `#6c757d` | Standard grey  |
| `600`| `#5e6977` | Dark           |
| `700`| `#43484d` | Darker         |
| `800`| `#2d3436` | Extra dark     |
| `900`| `#111111` | Near black     |

## Accent colors

| Property    | Value     | Meaning                    |
|-------------|-----------|----------------------------|
| `primary`   | `#000000` | Main brand (black)         |
| `secondary` | `#ffffff` | Secondary (white)         |
| `accent`    | `#FFD700` | Gold – used for ratings   |

## Functional palette (status / feedback)

| Property  | Value     | Meaning                          |
|-----------|-----------|----------------------------------|
| `success` | `#3d5c5c` | Teal – matches auth screens      |
| `warning` | `#FF9800` | Warning state                    |
| `error`   | `#800000` | Dark red – matches ads/errors   |
| `info`    | `#2196F3` | Information                      |

## UI-specific

### `colors.background`

| Property    | Value               | Meaning        |
|-------------|---------------------|----------------|
| `primary`   | `#ffffff`           | Main background|
| `secondary` | `#f8f9fa`          | Secondary bg   |
| `card`      | `#ffffff`          | Cards          |
| `modal`     | `rgba(0,0,0,0.5)`  | Modal overlay  |

### `colors.text`

| Property    | Value     | Meaning        |
|-------------|-----------|----------------|
| `primary`   | `#111111` | Main text      |
| `secondary` | `#666`    | Secondary text |
| `muted`     | `#6c757d` | Muted text     |
| `white`     | `#ffffff` | White text     |

### `colors.border`

| Property | Value     | Meaning   |
|----------|-----------|-----------|
| `light`  | `#e9ecef` | Light     |
| `medium` | `#dee2e6` | Normal    |
| `dark`   | `#adb5bd` | Dark      |

## Screen-specific: auth (SignIn / SignUp)

| Property     | Value                                      | Meaning             |
|--------------|--------------------------------------------|---------------------|
| `primary`    | `#3d5c5c`                                  | Auth primary (teal)|
| `background` | `#b3b3b3`                                  | Auth screen bg     |
| `gradient1`  | `['#948E99', '#2E1437']`                   | Primary gradient   |
| `gradient2`  | `['#ada996', '#f2f2f2', '#dbdbdb', '#eaeaea']` | Secondary gradient |

## Legacy (backward compatibility)

These aliases are kept so existing imports keep working. Prefer `colors.grey[n]` for new code.

| Property        | Value     | Alias / note        |
|-----------------|-----------|---------------------|
| `buttons`       | `"black"` | Default button color|
| `grey1`         | `#43484d` | Alias for grey.700  |
| `grey2`         | `#5e6977` | Alias for grey.600  |
| `grey3`         | `#86939e` | Alias for grey.500  |
| `grey4`         | `#bdc6cf` | Alias for grey.200  |
| `grey5`         | `#e1e8ee` | Alias for grey.100  |
| `cardComment`   | `#86939e` | Card comment text   |
| `cardbackground`| `white`   | Card background     |
| `statusbar`     | `#ff8c52` | Status bar color    |
| `headerText`    | `white`   | Header text color   |

## Additional

| Property   | Value            | Meaning          |
|------------|------------------|------------------|
| `rating`   | `#FFA000`        | Stars / ratings  |
| `divider`  | `#F0F0F0`        | Dividers         |
| `highlight`| `#FFF9E6`        | Highlight        |
| `shadow`   | `rgba(0,0,0,0.1)`| Shadows          |

## Usage in customer-app

`colors` is imported across most screens and shared components (home, cart/checkout, orders, wallet, settings, maps, navigation). Prefer `colors.grey[n]` for new greys; legacy `colors.grey1`…`grey5` remain for older screens (e.g. PreferenceScreen styles).
