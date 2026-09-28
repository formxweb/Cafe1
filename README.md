# La Joie Kitchen & Coffee — web sitesi

Mersin, Dershaneler Sokağı'ndaki La Joie için tek sayfalık, bölümlerden oluşan bir marka sitesi.
Astro ile üretilen statik bir sitedir; herhangi bir statik barındırmada (Netlify, Vercel,
Cloudflare Pages, kendi sunucunuz) çalışır.

```bash
npm install
npm run dev       # geliştirme: http://localhost:4321
npm run build     # üretim çıktısı: dist/
npm run preview   # dist/ klasörünü yerelde sunar
```

## Konsept

Logodaki **i harfinin üstündeki altın nokta ve gülümseme** sitenin tek vurgusudur.
Renkler logodan gelir: koyu yeşil (`#173f32`), kağıt kreması (`#f7f0e2`) ve altın (`#c6a15b`).
Altın yalnızca bu nokta için kullanılır. Nokta her bölüm başlığının sonunda noktalama işaretidir,
kapakta masthead'in üstüne düşer, *Gün* bölümünde 09:00'dan 22:00'ye güneş gibi yol alır ve
menüde seçili kategoriyi işaretler.

Bölümler: **Kapak → la joie (sözlük) → Masa → Menü → Gün → Instagram → Ziyaret**.

## İçerik nereden geliyor

Sitede **uydurma bilgi yoktur.** Tüm işletme bilgileri `src/data/site.js` dosyasındadır:

| Bilgi | Kaynak |
| --- | --- |
| Telefon `0540 013 32 33`, Instagram `@lajoiecoffee` | Marka sahibinin brifi |
| Adres (Dershaneler Sokağı, Mersin), saatler (her gün 09:00–22:00), ön sipariş (11:30–19:30, ödeme kasada) | Mevcut menü uygulamasının ayarları (lajoiemersin.com.tr) |
| Menü, fiyatlar, seçenekler, ürün fotoğrafları | Mevcut menü uygulamasının veritabanı |
| Logo ve amblem | Mevcut sitedeki resmi SVG dosyaları |

### Menü ve fiyatlar

- `npm run sync:menu` menüyü güncel haliyle `src/data/menu.json` dosyasına çeker ve yeni
  ürün fotoğraflarını `src/assets/menu/` klasörüne indirir. Ardından `npm run build`.
- Sayfa açıldığında fiyatlar menü uygulamasından **canlı olarak** da okunur. Fiyat değişirse
  sayfadaki fiyat güncellenir, menüden kaldırılan ürün gizlenir, tükenen ürün işaretlenir.
  Bağlantı kurulamazsa son senkronizasyondaki fiyatlar görünür. Kapatmak için
  `src/data/site.js` içinde `liveMenu.enabled: false`.
- Yeni bir ürünün yazısı ve fiyatı `sync:menu` ile gelir; editoryal sahnelerdeki (Masa, Gün)
  ürün seçimi ise ilgili bileşenlerde elle yapılır.

### Ürün fotoğrafları

Menüde ürünler kendi stüdyo fotoğraflarıyla (krem kağıt ve La Joie filigranı) görünür.
Kapak, Masa ve Gün bölümlerindeki ürünler ise arka planı temizlenmiş kesimlerdir
(`src/assets/cutouts/`). Yeni fotoğraf için:

```bash
python3 -m venv .venv && .venv/bin/pip install "rembg[cpu]" pillow scipy
.venv/bin/python scripts/cutouts.py          # sadece yeni fotoğraflar
.venv/bin/python scripts/cutouts.py 36 89    # belirli ürünleri yeniden üret
```

Beyaz tabaklar krem zeminde modeller için zordur; betik tabakları renk farkıyla geri kazanır.
Profiterol, roll kruvasan ve tel tepsili menülerde sonuç kusursuz değildir; bu ürünler
editoryal sahnelerde kullanılmaz.

### Logo

`src/components/brand/paths.js` resmi logo dosyalarından üretilir. Orijinal SVG bir
bitmap'ten otomatik çizildiği için büyük boyutta köşeli görünüyordu; `scripts/smooth-logo.py`
harf formlarını koruyarak eğrileri yumuşatır. Paylaşım görseli (`public/og.jpg`)
`node scripts/og-image.mjs` ile yeniden üretilir.

## Yayına almadan önce

1. **Instagram hesabı:** Brifte `@lajoiecoffee` verildi, ancak mevcut menü uygulamasının
   ayarlarında `cafe.lajoie` yazıyor. Doğru hesabı `src/data/site.js` içinde teyit edin.
2. **Harita:** Yalnızca sokak adı doğrulanabildi, bu yüzden “Haritada aç” bağlantısı
   “La Joie, Dershaneler Sokağı, Mersin” araması açar. Google Haritalar'daki işletme
   bağlantısını `mapsUrl` alanına yazın.
3. **Ön sipariş bağlantısı:** Şu an `https://www.lajoiemersin.com.tr/` adresindeki menü
   uygulamasına gider. Bu site aynı alan adında yayınlanacaksa uygulamayı bir alt alan
   adına (ör. `siparis.lajoiemersin.com.tr`) taşıyıp `preorder.url` alanını güncelleyin.
4. **Mekân fotoğrafları:** Mekânın iç mekân fotoğraflarına erişilemedi (Instagram erişime
   kapalıydı). Bu yüzden “Masa” bölümü mekânı ürünlerle kurulan bir natürmort olarak anlatır.
   Gerçek mekân fotoğrafları geldiğinde bu bölüm fotoğraflı hale getirilebilir.
5. Alan adı farklıysa `src/data/site.js` içindeki `url`, `public/robots.txt` ve
   `public/sitemap.xml` güncellenmelidir.

## Yapı

```
src/
  components/      Bölümler (Cover, Definition, Table, Menu, Day, Social, Visit, Footer, Nav)
    brand/         Logo ve amblem (satır içi SVG, altın nokta ayrı hareket eder)
  data/            site.js (işletme bilgileri), menu.json (menü anlık görüntüsü)
  lib/             Menü, fiyat ve çalışma saati yardımcıları (sunucu ve tarayıcı ortak)
  scripts/         Tarayıcı tarafı: kaydırma döngüsü, görünme animasyonları, canlı durum
  styles/          Tasarım token'ları ve temel stiller
scripts/           Menü senkronizasyonu, ürün kesimleri, logo yumuşatma, paylaşım görseli
```

Erişilebilirlik: anlamsal HTML, klavye ile gezilebilen menü sekmeleri (ok tuşları),
görünür odak, `prefers-reduced-motion` desteği (tüm kaydırma sahneleri son halleriyle
statik görünür) ve JavaScript kapalıyken tüm menünün açık listelenmesi.
