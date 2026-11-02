export const firstRoundProducts = [
  { id: 'transparent', image: 'product-transparent-frame.jpg', name: '賽璐璐透明層疊紀念框', material: '高級款・最高加購價', description: '把鐵道風景收進透明層次，讓旅程成為桌上的紀念。', fee: 599 },
  { id: 'ticket-keyring', image: 'product-ticket-keyring.jpg', name: '木質鐵道票牌鑰匙圈', material: '木質票牌・隨身紀念', description: '把一張旅程的小票牌掛上鑰匙，每天帶著鐵道回憶出門。', fee: 0 },
  { id: 'otter', image: 'product-05.jpg', name: '鐵道水獺布偶', material: '原創角色・織物', description: '帶一位小小旅伴回家，記住今天的鐵道故事。', fee: 399 },
  { id: 'wooden', image: 'product-03.jpg', name: '木製拼裝小火車', material: '木質・立體組裝', description: '把沿途收集的回憶，化成可以組裝的收藏。', fee: 349 },
  { id: 'train-plush', image: 'product-04.jpg', name: '火車造型抱枕', material: '柔軟織物・居家陪伴', description: '把小火車的模樣，變成一份柔軟的陪伴。', fee: 249 },
  { id: 'rabbit-stationmaster', image: 'product-rabbit-stationmaster-v1.jpg', name: '垂耳兔站長娃娃', material: '原創角色・柔軟絨毛', description: '奶油白垂耳、墨綠站長帽和淡粉領巾，讓小兔站長陪你收藏沿途的回憶。', fee: 149, priceNote: '價格待確認。' },
]

export const getRedemptionProduct = id => firstRoundProducts.find(product => product.id === id) || null
