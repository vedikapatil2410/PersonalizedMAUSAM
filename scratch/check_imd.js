async function testCities() {
  const stations = [
    { city: 'Pune', id: '43063' },
    { city: 'Mumbai', id: '43003' },
    { city: 'Delhi', id: '42182' }
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://mausam.imd.gov.in/',
    'Origin': 'https://mausam.imd.gov.in',
    'Accept': '*/*'
  };

  for (const s of stations) {
    const url = `https://mausam.imd.gov.in/responsive/LIP/sample4State.php?id=${s.id}`;
    const res = await fetch(url, { headers });
    const text = await res.text();
    console.log(`=== ${s.city} (${s.id}) ===`);
    console.log(text.replace(/\t+/g, ' ').replace(/\n+/g, '\n'));
  }
}
testCities();
