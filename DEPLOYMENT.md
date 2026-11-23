# Toonflow dağıtım rehberi

| Bilgi | Kaynakta kayıtlı değer |
| --- | --- |
| GitHub deposu | https://github.com/hiktan44/Toonflow |
| Coolify paneli | https://seymata.com |
| Uygulama adresi | https://e2z8qqbf9varx40d02mcc87y.seymata.com |
| Uygulama kimliği | `e2z8qqbf9varx40d02mcc87y` |
| Dağıtım dalı | `master` |
| Derleme yöntemi | `Dockerfile` |
| İç port | `10588` |

Bu bilgiler depo belgesinden gelir. Canlı sürümü, durumu ve alan adını dağıtımdan önce Coolify panelinde doğrulayın.

## Ortam değişkenleri

| Değişken | Açıklama |
| --- | --- |
| `NODE_ENV` | Mevcut Dockerfile backend için `dev` kullanır. |
| `PORT` | Sunucu iç portu; mevcut değer `10588`. |
| `FAL_KEY` | FAL entegrasyonları için sağlayıcı anahtarı. Gerçek değeri ortam/sır deposunda saklayın. |
| `OSSURL` | İsteğe bağlı statik kaynak adresi. |
| `COOLIFY_TOKEN` | Aşağıdaki yönetim API örneklerinin anahtarı; uygulama istemcisine gönderilmez. |

Gerçek anahtarları Git dosyalarına, bu belgeye veya komut çıktısına yazmayın. Üretim ortam dosyalarını Git deposu dışında veya Coolify ortam değişkenlerinde yönetin. Bu belge hiçbir gerçek anahtar içermez.

## Yerel Docker kurulumu

Docker ve Git gerekir. Mevcut imaj Node 24 kullanır.

```sh
git clone https://github.com/hiktan44/Toonflow.git
cd Toonflow
# Yerel .env dosyanızı gerçek değerleri Git'e kaydetmeden hazırlayın.
docker build -t toonflow .
docker run -d --name toonflow -p 10588:10588 \
  --env-file .env \
  -v toonflow-data:/app/data \
  toonflow
```

Tarayıcıda `http://localhost:10588/` adresini açın. SQLite veritabanı, yüklemeler ve web çıktısı `/app/data` altındadır; kalıcı diski silmeyin. Bağlı disk imajdaki web dosyalarını geçersiz kılabilir. F04 web HTML enjeksiyonu düzeltmesi ve TR/EN dil desteği `master` dalında PR #3, PR #4 ve PR #5 ile uygulanmıştır (`scripts/inject-lang.js`).

İlk kurulum hesabını güvenli bir parolayla değiştirin. Bu belge hazır yönetici parolasıyla giriş veya mevcut üretim hesabını değiştirmez.

## Coolify üzerinden dağıtım

1. Coolify paneline giriş yapın.
2. Toonflow projesi ve uygulamasını açın.
3. Git kaynağını, `master` dalını, Dockerfile yöntemini ve `10588` portunu doğrulayın.
4. Ortam değişkenlerini panelin güvenli alanında tanımlayın.
5. İncelenmiş değişiklikleri birleştirdikten sonra dağıtımı başlatın.
6. Dağıtım günlükleri, web açılışı, konsol, giriş ve ana özellikleri kontrol edin.

Alan adı için uygulamanın ayarlarındaki Domains (Alan adları) bölümünü kullanın ve DNS kaydını sunucuya yönlendirin.

## Coolify API örnekleri

Anahtarı yerel kabuğun güvenli isteminde veya CI sır deposunda `COOLIFY_TOKEN` olarak tanımlayın. Gerçek değeri komutun içine yazmayın; `set -x`, ayrıntılı curl izleme ve anahtarı ekrana basma işlemlerini kullanmayın. Çift tırnaklı başlık ortam değişkenini genişletir.

```sh
# Anahtar tanımlı değilse istek gönderilmez.
: "${COOLIFY_TOKEN:?Coolify erişim anahtarı güvenli ortamda tanımlanmalı}"

# İncelenmiş kodun yeni dağıtımını başlatır; üretimi değiştirir.
curl --fail-with-body -X POST \
  -H "Authorization: Bearer ${COOLIFY_TOKEN}" \
  "https://seymata.com/api/v1/deploy?uuid=e2z8qqbf9varx40d02mcc87y&force=true"
```

İsteğe bağlı alan adı değişikliği de üretim ayarını değiştirir:

```sh
: "${COOLIFY_TOKEN:?Coolify erişim anahtarı güvenli ortamda tanımlanmalı}"
curl --fail-with-body -X PATCH \
  -H "Authorization: Bearer ${COOLIFY_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"fqdn":"https://toonflow.example.com"}' \
  "https://seymata.com/api/v1/applications/e2z8qqbf9varx40d02mcc87y"
```

Bu örnekler belge kontrolünde çalıştırılmaz.

## Açığa çıkan anahtarları yenileme — F50

Önceki `DEPLOYMENT.md`, `DEPLOYMENT.docx` ve `DEPLOYMENT.pdf` belgelerindeki somut Coolify anahtarı ile `.env.production` ve `docker-compose.yml` dosyalarındaki somut `FAL_KEY` değeri kaldırıldı. Geçerlilikleri ve yetki kapsamları bu düzeltmede denenmedi. Eski değerler Git geçmişinde ve daha önce alınmış kopyalarda bulunabilir; dosyalardan kaldırmak anahtarları iptal etmez.

Coolify panelindeki API Tokens (API anahtarları) bölümünden ilgili eski anahtarı iptal edin ve FAL AI panelinden açığa çıkan `FAL_KEY` anahtarını yenileyin. Gerekli entegrasyonlar için en dar yetkiyle yeni anahtarlar oluşturun; yeni değerleri Coolify ortam değişkenlerinde ve güvenli sır deposunda güncelleyin. Coolify işlem kayıtları ve Git geçmişindeki sızıntı ayrıca değerlendirilmelidir. Bu düzeltme üretimde iptal, yenileme veya dağıtım yapmaz; F50 canlı iptal ve anahtar yenilemesi doğrulanana kadar açık kalır.

## Model sağlayıcı ayarları

Toonflow model sağlayıcılarını eklenti sistemiyle yönetir. Arayüzde Settings (Ayarlar) → Vendor Configuration (Sağlayıcı yapılandırması) bölümünden gereken sağlayıcıyı ve modelini tanımlayın. OpenAI, DeepSeek, KlingAI, MiniMax, Vidu ve diğer sağlayıcıların gerçek anahtarlarını yalnız güvenli ayar alanında girin. `FAL_KEY` tanımlanması bütün modellerin çalıştığını kanıtlamaz; her kullanılan model ayrıca denenmelidir.

## Belge güvenlik kontrolü

```sh
node --test tests/deployment-secrets.test.mjs
node scripts/check-deployment-secrets.mjs
```

Kontrol dağıtım belgelerine ve yapılandırma dosyalarına yeniden somut Bearer/Basic anahtarı, Coolify anahtar ataması, `FAL_KEY` değeri veya yasaklı ikili belge/ortam dosyası (`DEPLOYMENT.docx`, `DEPLOYMENT.pdf`, `.env.production`) eklenmesini reddeder. Hata çıktısı yalnız dosya, tür ve satır numarası içerir; anahtar değeri gösterilmez. Bu dar kontrol kapsamlı sır taraması ve geçmiş incelemesinin yerine geçmez.
