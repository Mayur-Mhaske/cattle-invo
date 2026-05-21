# 🌾 शेतकरी बिलिंग सिस्टम
### जनावरांचे खाद्य व्यवसाय व्यवस्थापन
**Made by Mayur Mhaske**

---

## ⚡ सुरुवात कशी करायची (Setup)

### आवश्यक गोष्टी:
- Node.js (v16+) — https://nodejs.org
- MongoDB Compass — चालू असणे आवश्यक (mongodb://localhost:27017)

### पायऱ्या:

```bash
# 1. backend फोल्डरमध्ये जा
cd shetkari-billing/backend

# 2. packages install करा
npm install

# 3. सर्व्हर चालू करा
npm start
```

**Browser मध्ये उघडा:** http://localhost:3000

---

## 📦 Features

| वैशिष्ट्य | तपशील |
|---|---|
| 🧾 बिलिंग | नवीन बिल, सूट देणे, partial/full/udhar payment |
| 📦 गोदाम | स्टॉक tracking, कमी स्टॉक alert |
| 👥 ग्राहक | ग्राहक इतिहास, उधार tracking |
| 💰 देयके | उधार भरणा, payment history |
| 💸 खर्च | कामगार वेतन, भाडे, वाहतूक tracking |
| 📈 अहवाल | मासिक नफा, विक्री, उधार बाकी |

## 💡 महत्त्वाच्या गोष्टी

- **Payment tracking:** "वसूल झालेले" = त्या महिन्यात मिळालेले पैसे (कोणत्याही महिन्याच्या बिलाचे)
- **सूट:** प्रत्येक वस्तूची किंमत बदलता येते (bulk discount साठी)
- **MongoDB:** सगळा data mongodb://localhost:27017/shetkari_billing मध्ये साठवला जातो

## 📁 Folder Structure

```
shetkari-billing/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints  
│   └── server.js        # Main server
└── frontend/
    ├── css/style.css
    ├── js/              # Page scripts
    └── index.html
```
