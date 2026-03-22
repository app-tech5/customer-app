# Documentation — Good Food Customer App

Technical documentation for the **Good Food** customer application in this repository (`doc/` at project root).

---

## 📖 Documentation Index

### 🏗️ Architecture & Technical Reference

#### [Architecture Overview](./architecture.md)
Complete technical documentation including:
- ✅ **Tech Stack**: React Native 0.81.5, Expo SDK 54, Redux 5
- ✅ **Project Structure**: Components, screens, navigation, contexts
- ✅ **API Layer**: `api/` (ApiClient + endpoints, auth, promotions)
- ✅ **State Management**: Redux + React Context
- ✅ **Internationalization**: `lang/` (i18n setup + docs)
- ✅ **Key Features**: Ordering, payments, tracking, promotions

#### [API Reference](./api-reference.md)
Complete REST API documentation:
- ✅ **Authentication**: Login, register, JWT tokens
- ✅ **Users**: Profile, addresses, favorites
- ✅ **Restaurants**: Listing, details, categories
- ✅ **Orders**: Create, track, history
- ✅ **Cart**: Server-side cart management
- ✅ **Payments**: Wallet, payment methods
- ✅ **Promotions**: Offers, discounts

Additional module-level docs:

- `api/README.md` + `api/docs/`
- `components/README.md` + `components/docs/`
- `global/README.md` + `global/docs/`
- `lang/README.md` + `lang/docs/`
- `config/README.md`

---

## 📋 Updates History

### 📅 By Month

#### [2025-01] - Demo Mode + Internationalization
**File:** [`2025-01-updates.md`](./2025-01-updates.md)
- ✅ **Demo mode**: Automatic login (`demo@customer.com`)
- ✅ **Complete internationalization**: French/English with auto-detection
- ✅ **Technical fixes**: Dependencies conflicts resolution, i18n errors
- ✅ **Functional API**: User route added, no 404 errors

### 📚 Major Versions

#### Historical migration (Firebase → REST API)
**File:** [`migration-api-firebase.md`](./migration-api-firebase.md)
- Record of moving from Firebase to the custom REST API
- JWT, MongoDB, and related client changes
- Navigation and import fixes from that period

---

## 🚀 Quick Start

### Current Stack
| Component | Version |
|-----------|---------|
| React Native | 0.81.5 |
| Expo SDK | 54.0.0 |
| React | 19.1.0 |
| Redux | 5.0.0 |

### Demo Credentials
```
Email: demo@customer.com
Password: demo123
```

### Scripts
```bash
npm start          # Start dev server
npm run ios        # Run on iOS
npm run android    # Run on Android
npm run lint       # Check code quality
```

---

## 📖 How to Use This Documentation

### For Developers
1. **Start here:** Read [`architecture.md`](./architecture.md) for project overview
2. **Before an update:** Check recent changes in monthly files
3. **Troubleshooting:** Verify resolved issues in updates
4. **Migration:** Follow detailed migration guides

### For Testers
1. **New features:** Test recent additions
2. **Regressions:** Verify applied fixes
3. **Compatibility:** Check dependency changes

---

## 🏗️ Files Structure

```
doc/
├── README.md                    # This file - Documentation index
├── architecture.md              # Technical architecture reference
├── api-reference.md             # REST API endpoints documentation
├── 2025-01-updates.md          # Monthly updates (January 2025)
└── migration-api-firebase.md   # Historical Firebase → REST migration notes
```

### Monthly files:
Group all updates of the month with:
- **Chronological summary** of changes
- **Essential instructions** for developers
- **Metrics and impact** of the month

### Reference files:
- Architecture documentation
- Major versions and migrations
- Permanent technical guides

---

## 📝 Naming Convention

### Monthly files:
```
YYYY-MM-updates.md
```
Example: `2025-01-updates.md` (all January 2025 updates)

### Reference files:
- `architecture.md` (technical reference)
- `migration-*.md` (migration guides)

---

## 🤝 Contribution

### Monthly format:
1. **At the end of each month**: Create `YYYY-MM-updates.md`
2. **Group** all changes of the month
3. **Update** this `README.md` file
4. **Archive** technical details in the monthly file

### Architecture updates:
1. **After major changes**: Update `architecture.md`
2. **Document** new features, APIs, or patterns
3. **Keep** dependency versions current

### Daily files:
- Reserved for urgent fixes only
- Format: `YYYY-MM-DD-urgent-fix.md`

---

## 📞 Support

If you have problems with an update:
1. Check the corresponding documentation
2. Review the troubleshooting solutions
3. Open an issue if necessary

---
*Last update: 2026-03-14*
