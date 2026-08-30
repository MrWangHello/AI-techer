const CITY_MAP: Record<string, string> = {
  北京: "Beijing",
  上海: "Shanghai",
  广州: "Guangzhou",
  深圳: "Shenzhen",
  杭州: "Hangzhou",
  成都: "Chengdu",
  武汉: "Wuhan",
  西安: "Xian",
  南京: "Nanjing",
  重庆: "Chongqing",
};

function pickCity(text: string): string {
  for (const [cn, en] of Object.entries(CITY_MAP)) {
    if (text.includes(cn)) return en;
  }
  return "Beijing";
}

function codeToDesc(code: number): string {
  if (code === 0) return "晴";
  if (code <= 3) return "多云";
  if (code <= 48) return "有雾";
  if (code <= 67) return "有雨";
  if (code <= 77) return "有雪";
  return "变化";
}

export async function fetchWeather(text: string): Promise<string> {
  const cityQuery = pickCity(text);
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityQuery)}&count=1&language=zh`,
    { signal: AbortSignal.timeout(12000) }
  );
  if (!geoRes.ok) throw new Error("geocoding failed");
  const geo = await geoRes.json();
  const place = geo.results?.[0];
  if (!place) throw new Error("city not found");

  const wxRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code&timezone=auto`,
    { signal: AbortSignal.timeout(12000) }
  );
  if (!wxRes.ok) throw new Error("weather failed");
  const wx = await wxRes.json();
  const temp = wx.current?.temperature_2m ?? "?";
  const desc = codeToDesc(wx.current?.weather_code ?? 0);
  return `${place.name}现在${desc}，气温约 ${temp}°C。`;
}
