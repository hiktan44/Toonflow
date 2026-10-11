# Web arayüzü ve dil ekleme düzeltmesi — F04

Coolify'ın kullandığı `master` dalındaki `data/web/index.html` dosyasına dil, SEO, yasal bağlantı ve PWA blokları eklenirken ilk `</head>` ve `</body>` metni değiştirilmişti. Bu metinler, derlenmiş uygulama içindeki DOMPurify XML sarmalayıcısının JavaScript dizgesindeydi. Eklenen `</script>` gerçek modülü erken kapatıyor; devamındaki uygulama kodu sayfada metin olarak görünüyordu.

Hazırlama aracı yalnız bu bilinen, tekil hasarlı sarmalayıcıyı onarır. SEO, yasal bağlantı ve PWA bloklarını gerçek belgeye taşır. Dil ekleme işlemi betik, stil, yorum ve metin alanlarını atlayarak gerçek `head`/`body` kapanışlarını kullanır. Üretilen CSS, `style` etiketi içine alınır. Başlangıç dili kayıtlı tercihten, tercih yoksa Türkçeden gelir; elle İngilizce seçimi korunur. Belge dili de seçimle güncellenir.

Her hazırlamada gerçek JavaScript modülü ve klasik betikler Node sözdizimi kontrolünden; JSON betikleri JSON kontrolünden geçer. Kontrol başarısızsa kaynak dosyaya yazılmaz. Başarılı çıktı aynı dizinde geçici dosyayla atomik değiştirilir; dosya izinleri korunur. Tekrar çalıştırma dil bloklarını çoğaltmaz.

## Çalıştırma

Node 22.12 veya üzeri gerekir. Docker imajı hazırlanırken ve konteyner her açıldığında kontrol çalışır; böylece bağlı veri diskindeki eski web çıktısı da hazırlanır. `npm run dev`, `npm start`, mevcut `build` ve `inject-i18n` komutları da web dosyasını hazırlar. Doğrudan çalıştırmak için:

```sh
node --experimental-strip-types scripts/prepare-web.mjs
```

Testler backend bağımlılıklarını, veritabanını veya model sağlayıcısını başlatmaz. Yalnız test ayrıştırıcısını kurup gerçek Git çıktısı üzerinde çalıştırın:

```sh
npm ci --ignore-scripts --prefix tests/html-parser
npm run test:web
```

## Doğrulama ve kabul sınırı

Node 22 ve 24 için 16 regresyon testi vardır. Gerçek HTML5 ayrıştırıcısı mevcut çıktıda bir milyondan fazla karakterin gövdeye taştığını; onarım sonrasında ana modülün bütünüyle gerçek betikte kaldığını doğrular. Kaynak ileride düzeltilmiş çıktıyla yenilenirse testler bunu kabul eder; bağımsız küçük hasarlı örnek onarım regresyonunu korur. Testler ayrıca modül içeriğinin yeniden dil eklenirken değişmemesini, beş betiğin sözdizimini, SEO/yasal/PWA konumlarını, atomik dosya yazımını ve tekrar çalıştırmayı kontrol eder. Dil seçimi gerçek üretilen kodla, izole DOM/saklama benzetimi üzerinde denenir.

Bu paket tam backend tür kontrolü/derlemesi, Docker imajı derlemesi veya canlı tarayıcı kullanıcı kabulü değildir. Coolify'a dağıtımdan sonra ana ekran, tarayıcı konsolu, giriş, proje açma ve dil değiştirme ayrıca kontrol edilmelidir. Kaynak dosya depoda korunur; dağıtımda hazırlama adımı onarılmış çıktıyı üretir. Bu PR birleştirilmeden ve yeni imaj dağıtılmadan canlı uygulama değişmez.

F50'deki dağıtım belgesinde bulunan erişim anahtarı ayrı bulgudur. Bu web düzeltmesi o anahtarı iptal etmez veya üretim kimlik bilgilerini değiştirmez.
