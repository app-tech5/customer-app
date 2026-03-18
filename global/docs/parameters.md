# Parameters

Layout and button style parameters. Source: `../parameters.js`.

## `parameters`

Shared UI dimensions and default styles.

### `parameters.headerHeight`

- **Type:** `number`
- **Value:** `40`
- **Meaning:** Default header height (e.g. for navigation headers).

### `parameters.styledButton`

Default style object for primary buttons.

| Property          | Value       |
|-------------------|-------------|
| `backgroundColor` | `'black'`   |
| `borderRadius`    | `12`        |
| `paddingHorizontal` | `20`     |
| `width`           | `"100%"`    |
| `borderWidth`     | `1`         |
| `borderColor`     | `'black'`   |
| `height`          | `50`        |

### `parameters.buttonTitle`

Default text style for button titles.

| Property   | Value     |
|------------|-----------|
| `fontSize` | `20`      |
| `fontWeight` | `"bold"` |
| `marginTop` | `-3`     |

## `title`

Default style object for screen or section titles.

| Property   | Value     |
|------------|-----------|
| `color`    | `"black"` |
| `fontSize` | `20`      |
| `fontWeight` | `"bold"` |

## Usage in customer-app

`parameters` and `title` are not currently imported elsewhere; they are available for headers and buttons when you need a consistent look.
