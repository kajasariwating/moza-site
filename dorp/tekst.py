"""Talen van live.moza.nu: Nederlands (nl) en Indonesisch (id).

De Nederlandse zin is de sleutel. Zo blijft de code leesbaar en verandert de Nederlandse site niet.
Gebruik:  t('Het is rustig rond {naam}.', naam=n)
Staat een zin niet in ID, dan blijft hij Nederlands (en meldt ontbrekend() dat bij het bouwen).
"""

TAAL = 'nl'
_MIST = set()


def zet(taal):
    global TAAL
    TAAL = taal


def t(nl, **kw):
    s = nl
    if TAAL == 'id':
        s = ID.get(nl)
        if s is None:
            _MIST.add(nl)
            s = nl
    return s.format(**kw) if kw else s


def pre():
    """Voorvoegsel voor links binnen de site: '' (nl) of '/id' (id)."""
    return '/id' if TAAL == 'id' else ''


def ontbrekend():
    return sorted(_MIST)


# ---------------------------------------------------------------- Indonesisch
# Bahasa Indonesia, eenvoudig en gewoon. Graag laten nalezen door iemand uit Maluku.

ID = {
    # ---- taal.py: afstand
    'vlakbij': 'dekat sekali',
    'een paar minuten lopen': 'beberapa menit jalan kaki',
    'een kwartier lopen': 'seperempat jam jalan kaki',
    'twintig minuten lopen': 'dua puluh menit jalan kaki',
    'een half uur lopen': 'setengah jam jalan kaki',
    'drie kwartier lopen': 'tiga perempat jam jalan kaki',
    'ongeveer {n} kilometer': 'sekitar {n} kilometer',
    # richting
    'het noorden': 'utara', 'het noordoosten': 'timur laut', 'het oosten': 'timur', 'het zuidoosten': 'tenggara',
    'het zuiden': 'selatan', 'het zuidwesten': 'barat daya', 'het westen': 'barat', 'het noordwesten': 'barat laut',
    # brand
    'Bijna zeker een brand: meerdere satellieten zagen het.': 'Hampir pasti kebakaran: beberapa satelit melihatnya.',
    'Bijna zeker een brand.': 'Hampir pasti kebakaran.',
    'Niet zeker. Het kan ook een veld zijn dat werd schoongebrand, of iets anders dat heet is.':
        'Belum pasti. Bisa juga lahan yang sedang dibakar untuk dibersihkan, atau sesuatu yang lain yang panas.',
    'Waarschijnlijk een brand.': 'Kemungkinan besar kebakaran.',
    'Op de grond van het dorp.': 'Di wilayah desa.',
    'Net buiten de grond van het dorp.': 'Tepat di luar wilayah desa.',
    # lucht
    'Helder': 'Bersih', 'Lichte waas': 'Sedikit kabut asap', 'Rook': 'Asap', 'Dikke rook': 'Asap tebal',
    'De lucht is helder. Je kijkt ver over zee, ziet de bergen en de eilanden aan de overkant scherp en je ruikt geen rook.':
        'Udara bersih. Kamu bisa melihat jauh ke laut, gunung dan pulau di seberang terlihat jelas dan tidak tercium asap.',
    'Er hangt een lichte waas. Bergen en eilanden verderop zijn minder scherp te zien en soms ruik je een vleug rook. Voor de meeste mensen is dat geen probleem.':
        'Ada sedikit kabut asap. Gunung dan pulau di kejauhan kurang jelas dan kadang tercium sedikit asap. Untuk kebanyakan orang ini tidak masalah.',
    'Ouderen, mensen met gezondheidsklachten en kinderen blijven beter wat meer binnen.':
        'Orang tua, orang yang punya masalah kesehatan dan anak-anak sebaiknya lebih banyak di dalam rumah.',
    'Er hangt duidelijk rook. De lucht ziet grijs of geelachtig, de zon is flets en buiten ruik je het. Eilanden aan de overkant zijn slecht te zien.':
        'Asap jelas terlihat. Langit tampak abu-abu atau kekuningan, matahari redup dan di luar tercium asap. Pulau di seberang sulit terlihat.',
    'Ouderen, mensen met gezondheidsklachten en kinderen blijven het beste binnen. Iedereen doet het buiten rustig aan.':
        'Orang tua, orang yang punya masalah kesehatan dan anak-anak sebaiknya tetap di dalam rumah. Semua orang jangan terlalu banyak beraktivitas di luar.',
    'Er hangt dikke rook. Je kijkt vaak maar een paar honderd meter ver, de zon is een oranje bol en je ogen en keel kunnen prikken.':
        'Asap tebal. Jarak pandang sering hanya beberapa ratus meter, matahari tampak seperti bola oranye dan mata serta tenggorokan bisa perih.',
    'Iedereen blijft zo veel mogelijk binnen, met ramen en deuren dicht. Een mondkapje helpt buiten.':
        'Semua orang sebaiknya sebanyak mungkin di dalam rumah, dengan jendela dan pintu tertutup. Di luar, pakai masker.',
    # weer
    'Zon': 'Cerah', 'Zon en wolken': 'Cerah berawan', 'Bewolkt': 'Berawan', 'Mist': 'Berkabut', 'Motregen': 'Gerimis',
    'Regen': 'Hujan', 'Zware regen': 'Hujan lebat', 'Onweer': 'Hujan petir',
    'Snikheet': 'Sangat panas', 'Heet': 'Panas',
    "Drink genoeg en blijf tussen 12 en 3 uur 's middags in de schaduw.":
        'Minum cukup air dan tetap di tempat teduh antara jam 12 dan jam 3 siang.',
    # zee
    'Kleine golven': 'Ombak kecil', 'Wat golven': 'Sedikit berombak', 'Hoge golven': 'Ombak tinggi', 'Zeer hoge golven': 'Ombak sangat tinggi',
    'weinig wind': 'angin lemah', 'matige wind': 'angin sedang', 'harde wind': 'angin kencang', 'storm': 'badai',
    'bijna vlak': 'hampir tenang', 'tot je knieën': 'setinggi lutut', 'tot je heupen': 'setinggi pinggang',
    'tot je schouders': 'setinggi bahu', 'zo hoog als een mens': 'setinggi orang', 'hoger dan een mens': 'lebih tinggi dari orang',
    'Rustig water. Vissers kunnen met hun kleine boot gewoon ver de zee op.':
        'Laut tenang. Nelayan dengan perahu kecil bisa melaut jauh seperti biasa.',
    'Voor vissers die dit gewend zijn, is het te doen. De golven schommelen wel. Ze blijven dichter bij de kust.':
        'Bagi nelayan yang sudah biasa, masih bisa. Tapi perahu akan bergoyang. Sebaiknya tetap dekat pantai.',
    'Te ruw voor de meeste kleine boten. Veel vissers blijven aan wal of gaan maar kort de zee op, dicht bij huis.':
        'Terlalu kasar untuk kebanyakan perahu kecil. Banyak nelayan tidak melaut atau hanya sebentar, dekat kampung.',
    'Zwaar weer. Vissers blijven met hun kleine boot aan wal.':
        'Cuaca buruk. Nelayan dengan perahu kecil sebaiknya tidak melaut.',
    'Een rustige overtocht. Ook prima met kinderen en ouderen.':
        'Penyeberangan tenang. Aman juga untuk anak-anak dan orang tua.',
    'De boot vaart, maar het kan hobbelig zijn. Word je snel zeeziek? Neem iets mee of kies de ferry.':
        'Kapal tetap jalan, tapi bisa terasa goyang. Mudah mabuk laut? Siapkan obat atau pilih feri.',
    'Een flinke schommeltocht. Speedboten varen soms later of niet. Met kinderen of ouderen kies je beter een rustiger moment of de ferry. Vraag bij de haven of er gevaren wordt.':
        'Perjalanan akan sangat goyang. Speedboat kadang terlambat atau tidak berangkat. Dengan anak-anak atau orang tua, sebaiknya pilih waktu yang lebih tenang atau feri. Tanyakan di pelabuhan apakah kapal berangkat.',
    'Grote kans dat speedboten niet varen. Ook de ferry kan uitvallen. Vraag bij de haven en stel je reis zo nodig uit.':
        'Kemungkinan besar speedboat tidak berangkat. Feri juga bisa batal. Tanyakan di pelabuhan dan tunda perjalanan jika perlu.',
    'bijvoorbeeld van {eiland} naar Tulehu op Ambon': 'misalnya dari {eiland} ke Tulehu di Ambon',
    # bevingen
    'Heel licht. Alleen mensen die stil zitten of liggen merkten het. Alsof er een kleine vrachtwagen langsrijdt.':
        'Sangat lemah. Hanya orang yang sedang duduk diam atau berbaring yang merasakannya. Seperti truk kecil yang lewat.',
    'Licht. Te vergelijken met een zware vrachtwagen die vlak langs het huis rijdt: ramen en deuren trillen even.':
        'Lemah. Seperti truk besar yang lewat dekat rumah: jendela dan pintu bergetar sebentar.',
    'Stevig. Bijna iedereen voelde het. Spullen kunnen omvallen en slapende mensen worden wakker.':
        'Cukup kuat. Hampir semua orang merasakannya. Barang bisa jatuh dan orang yang tidur terbangun.',
    'Sterk. Mensen schrikken en gaan naar buiten. Kleine schade aan huizen is mogelijk.':
        'Kuat. Orang terkejut dan keluar rumah. Kerusakan kecil pada rumah mungkin terjadi.',
    'Zwaar. Kans op schade aan huizen. Neem contact op met je familie.':
        'Sangat kuat. Rumah bisa rusak. Hubungi keluargamu.',
    'een paar keer per maand': 'beberapa kali sebulan',
    'ongeveer één keer per maand': 'sekitar sekali sebulan',
    'een paar keer per jaar': 'beberapa kali setahun',
    'ongeveer één keer per jaar': 'sekitar sekali setahun',
    'minder dan één keer per jaar': 'kurang dari sekali setahun',
    # bos
    'bijna alles': 'hampir semua', 'de helft': 'separuh', '1 op de {n}': '1 dari {n}',
    'minder dan een voetbalveld': 'kurang dari satu lapangan sepak bola',
    '{n} voetbalvelden': '{n} lapangan sepak bola',

    # ---- bouw.py: weer, zee
    'Regen tot ongeveer {u}:00': 'Hujan sampai sekitar jam {u}:00',
    'Regen de komende uren': 'Hujan beberapa jam ke depan',
    'Regen vanaf ongeveer {u}:00': 'Hujan mulai sekitar jam {u}:00',
    'Droog de komende uren': 'Tidak hujan beberapa jam ke depan',
    'Ochtend': 'Pagi', 'Middag': 'Siang', 'Avond': 'Malam',

    # ---- kaart
    'Kaart van de grond van {naam} met plekken waar brand is gezien': 'Peta wilayah {naam} dengan titik kebakaran yang terlihat',
    'Wind': 'Angin',

    # ---- kop en balk
    'Deel deze pagina': 'Bagikan halaman ini',
    'Delen': 'Bagikan',
    'Ander dorp': 'Desa lain',
    'Ander dorp zoeken': 'Cari desa lain',
    'Kabar Maluku Live, naar de startpagina': 'Kabar Maluku Live, ke halaman utama',
    'Dit bericht staat al klaar': 'Pesan ini sudah siap',
    'Stuur via WhatsApp': 'Kirim lewat WhatsApp',
    'Kopieer link': 'Salin link',
    'Andere app kiezen': 'Pilih aplikasi lain',
    'Sluiten': 'Tutup',
    'Grotere letters aan of uit': 'Huruf lebih besar, nyala atau mati',
    'Nachtmodus aan of uit': 'Mode malam, nyala atau mati',
    'Over deze app': 'Tentang aplikasi ini',
    'Kies je taal': 'Pilih bahasa',

    # ---- veiligheid
    'Dit is geen officiële waarschuwing.': 'Ini bukan peringatan resmi.',
    'Bij gevaar volg je altijd BMKG, MAGMA en de BPBD.': 'Saat ada bahaya, selalu ikuti BMKG, MAGMA dan BPBD.',
    'Officiële informatie:': 'Informasi resmi:',
    'weer, aardbevingen en tsunami': 'cuaca, gempa dan tsunami',
    'vulkanen': 'gunung api',
    'rampen in jouw regio': 'bencana di daerahmu',

    # ---- dorpspagina
    'In het dorp': 'Di desa',
    'Weer nu': 'Cuaca sekarang',
    'Zon op {t}': 'Matahari terbit {t}',
    'Zon onder {t}': 'Matahari terbenam {t}',
    'Kruimelpad': 'Navigasi',
    'Bewaar dit dorp': 'Simpan desa ini',
    'Brand, weer, zee en aardbevingen bij {naam}{off} in {kec}, {kab}. Elk uur bijgewerkt.':
        'Kebakaran, cuaca, laut dan gempa di {naam}{off}, Kecamatan {kec}, {kab}. Diperbarui setiap jam.',
    ' (officieel {o})': ' (nama resmi {o})',
    'zo staat het er nu voor': 'begini keadaannya sekarang',
    # samenvatting
    '{w} was er een aardbeving die je in {naam} <b>goed kon voelen</b>. Kijk hieronder hoe sterk.':
        '{w} ada gempa yang <b>terasa jelas</b> di {naam}. Lihat di bawah seberapa kuat.',
    'op de grond van het dorp': 'di wilayah desa',
    'vlak bij de grond van het dorp': 'dekat wilayah desa',
    '{w} zag de satelliet een brand {waar}, <b>{afst}</b> naar {richting}.':
        '{w} satelit melihat kebakaran {waar}, <b>{afst}</b> ke arah {richting}.',
    ' De wind blaast de rook vandaag <b>richting het dorp</b>.': ' Hari ini angin meniup asap <b>ke arah desa</b>.',
    ' De wind blaast de rook vandaag <b>weg van het dorp</b>.': ' Hari ini angin meniup asap <b>menjauhi desa</b>.',
    'De lucht in {naam} is vandaag <b>ongezond</b> door rook. {advies}': 'Udara di {naam} hari ini <b>tidak sehat</b> karena asap. {advies}',
    'Vandaag': 'Hari ini', 'Morgen': 'Besok',
    '{dag} wordt het <b>snikheet</b> in {naam}. {advies}': '{dag} akan <b>sangat panas</b> di {naam}. {advies}',
    'één keer': 'satu kali', '{n} keer': '{n} kali',
    'Deze week zag de satelliet {keer} brand in of rond {naam}. Niet in de afgelopen twee dagen.':
        'Minggu ini satelit melihat kebakaran {keer} di dalam atau sekitar {naam}. Tidak dalam dua hari terakhir.',
    'Het is rustig rond {naam}. De satelliet zag de afgelopen week <b>geen brand</b> in of rond het dorp.':
        'Keadaan tenang di sekitar {naam}. Seminggu terakhir satelit <b>tidak melihat kebakaran</b> di dalam atau sekitar desa.',
    # in het kort
    'Mensen': 'Penduduk', 'BPS, {jaar}': 'BPS, {jaar}',
    'Grond': 'Luas', 'voetbalvelden groot': 'lapangan sepak bola',
    'Hoogte': 'Ketinggian', 'laag gelegen': 'dataran rendah', 'in de heuvels': 'di perbukitan', 'in de bergen': 'di pegunungan',
    '{h} meter': '{h} meter',
    'Zee': 'Laut', 'Aan zee': 'Di tepi laut', 'het dorp ligt aan de kust': 'desa ini di pesisir',
    'Vlakbij': 'Dekat sekali', 'de kust is dichtbij': 'pantai dekat', 'tot de kust': 'ke pantai',
    'Afstand tot stad': 'Jarak ke kota', 'Vliegveld': 'Bandara',
    'met de boot, {km} km hemelsbreed': 'naik kapal, {km} km garis lurus',
    '{km} km over de weg': '{km} km lewat jalan',
    '{km} km hemelsbreed': '{km} km garis lurus',
    'Bron inwoners en grond: BPS, {b}.': 'Sumber penduduk dan luas: BPS, {b}.',
    'Bron inwoners: BPS, {b}.': 'Sumber penduduk: BPS, {b}.',
    'Over het dorp': 'Tentang desa',
    '{naam} in het kort': '{naam} secara singkat',
    # brand
    'Waar brandt het?': 'Di mana kebakaran?',
    'Is er brand?': 'Apakah ada kebakaran?',
    'De satelliet zag de afgelopen week geen brand in of rond {naam}.': 'Seminggu terakhir satelit tidak melihat kebakaran di dalam atau sekitar {naam}.',
    'Brand': 'Kebakaran',
    'Het blauwe vlak is de grond van {naam}.': 'Bidang biru adalah wilayah {naam}.',
    'Het zwarte blokje is het dorp.': 'Kotak hitam adalah desa.',
    'Het zwarte blokje is het midden van de grond van het dorp. Afstanden zijn vanaf dat punt.':
        'Kotak hitam adalah titik tengah wilayah desa. Jarak dihitung dari titik itu.',
    'Je ziet alles tot ongeveer 5 kilometer rondom.': 'Peta menunjukkan sampai sekitar 5 kilometer di sekelilingnya.',
    '{w} · {afst} naar {richting}': '{w} · {afst} ke arah {richting}',
    # weer
    '{dag} wordt het snikheet.': '{dag} akan sangat panas.',
    '{p}% kans op regen': '{p}% kemungkinan hujan',
    'Droog': 'Tidak hujan', 'droog': 'tidak hujan',
    'De dagen daarna': 'Hari-hari berikutnya',
    '{woord} vandaag, {g} graden.': '{woord} hari ini, {g} derajat.',
    'Weer': 'Cuaca',
    'Wat voor weer wordt het?': 'Bagaimana cuacanya nanti?',
    # lucht
    'nu': 'kini', 'morgen': 'besok',
    'Lucht': 'Udara',
    'Is de lucht gezond?': 'Apakah udaranya sehat?',
    'Hoe gezond de lucht was, per dag': 'Kualitas udara per hari',
    # zee
    'Morgen is het de hele dag rustig op zee.': 'Besok laut tenang sepanjang hari.',
    'Morgen staan er de hele dag wat golven.': 'Besok laut sedikit berombak sepanjang hari.',
    'Morgen is het de hele dag onrustig op zee.': 'Besok laut bergelombang sepanjang hari.',
    'Morgen is het de hele dag zwaar weer op zee.': 'Besok cuaca buruk di laut sepanjang hari.',
    'onrustig': 'bergelombang', 'wat woeliger': 'lebih berombak',
    'Morgen is de zee ’s {rustig}s het rustigst. ’s {woelig}s wordt het {hoe}.':
        'Besok laut paling tenang pada {rustig}. Pada {woelig} laut akan {hoe}.',
    '’s {deel}s': 'Pada {deel}',
    'Hoe is de zee morgen?': 'Bagaimana laut besok?',
    'Voor vissers met een kleine boot:': 'Untuk nelayan dengan perahu kecil:',
    'Op bezoek en wil je oversteken of eiland-hoppen met de speedboot of ferry{vb}?':
        'Mau menyeberang atau pindah pulau dengan speedboat atau feri{vb}?',
    # bevingen
    'De laatste beving die je in het dorp kon voelen, was {w}.': 'Gempa terakhir yang terasa di desa terjadi {w}.',
    "<b>Dat is normaal.</b> Rond {naam} voel je zo'n beving {hoe}.": '<b>Itu biasa.</b> Di sekitar {naam} gempa seperti ini terasa {hoe}.',
    'Bevingen die je voelt, zijn hier niet zo vaak: {hoe}.': 'Gempa yang terasa tidak terlalu sering di sini: {hoe}.',
    ' Kleine bevingen die je niet voelt, zijn er veel vaker.': ' Gempa kecil yang tidak terasa jauh lebih sering.',
    'Het afgelopen jaar was er geen beving die je in {naam} kon voelen.': 'Setahun terakhir tidak ada gempa yang terasa di {naam}.',
    'Aardbevingen': 'Gempa bumi',
    'Heeft de aarde gebeefd?': 'Apakah ada gempa?',
    # bos
    'Sinds 2001 is ongeveer {deel} stukken bos rond {naam} verdwenen.': 'Sejak 2001 sekitar {deel} bagian hutan di sekitar {naam} telah hilang.',
    'Sinds 2001 is ongeveer de helft van het bos rond {naam} verdwenen.': 'Sejak 2001 sekitar separuh hutan di sekitar {naam} telah hilang.',
    'Dat is zo groot als {v}.': 'Itu seluas {v}.',
    ' Het meeste verdween in {j}.': ' Paling banyak hilang pada tahun {j}.',
    'Het bos rond {naam} is sinds 2001 bijna niet kleiner geworden.': 'Hutan di sekitar {naam} hampir tidak berkurang sejak 2001.',
    'Bos': 'Hutan',
    'Hoeveel bos is er nog?': 'Berapa banyak hutan yang tersisa?',
    'Hoeveel bos er per jaar verdween': 'Luas hutan yang hilang per tahun',
    'Hoe hoger, hoe meer bos weg': 'Makin tinggi, makin banyak hutan hilang',
    # buren
    'Dorpen in de buurt': 'Desa di sekitar',
    'Alle dorpen in {g} →': 'Semua desa di {g} →',
    'Meer dorpen in {kec}': 'Desa lain di Kecamatan {kec}',
    'BRAND': 'KEBAKARAN',
    # delen
    'Hoe is het nu in {naam}? Brand, weer, zee en aardbevingen, ieder uur bijgewerkt.':
        'Bagaimana keadaan di {naam} sekarang? Kebakaran, cuaca, laut dan gempa, diperbarui setiap jam.',
    'Familie in {naam}?': 'Ada keluarga di {naam}?',
    'Stuur deze pagina door. Dan weet iedereen waar je kunt kijken als er iets gebeurt.':
        'Kirim halaman ini ke mereka. Jadi semua orang tahu di mana bisa melihat kalau terjadi sesuatu.',
    'Deel via WhatsApp': 'Bagikan lewat WhatsApp',
    'Andere manier': 'Cara lain',
    # vastzetten
    'Zet {naam} vast op je telefoon': 'Pasang {naam} di layar HP-mu',
    'Dan staat {naam} als icoontje tussen je apps en kijk je met één tik hoe het daar is.':
        'Nanti {naam} muncul sebagai ikon di antara aplikasimu dan kamu bisa melihat keadaannya dengan sekali sentuh.',
    'Zo doe je het': 'Caranya',
    'Tik onderaan op de deelknop (het vierkantje met het pijltje omhoog).': 'Sentuh tombol bagikan di bawah (kotak dengan panah ke atas).',
    'Kies <b>Zet op beginscherm</b>.': 'Pilih <b>Tambahkan ke Layar Utama</b>.',
    'Tik op <b>Voeg toe</b>.': 'Sentuh <b>Tambah</b>.',
    'Tik rechtsboven op de drie puntjes.': 'Sentuh tiga titik di kanan atas.',
    'Kies <b>Toevoegen aan startscherm</b>.': 'Pilih <b>Tambahkan ke layar utama</b>.',
    'Tik op <b>Toevoegen</b>.': 'Sentuh <b>Tambahkan</b>.',
    'Computer': 'Komputer',
    'Maak een bladwijzer: druk op Ctrl+D (Windows) of Cmd+D (Mac).': 'Buat bookmark: tekan Ctrl+D (Windows) atau Cmd+D (Mac).',
    # goed om te weten
    'Goed om te weten': 'Perlu diketahui',
    'De satelliet ziet van bovenaf waar het heet is. Meestal is dat brand, maar niet altijd. Twijfel je? Bel of app je familie.':
        'Satelit melihat dari atas tempat yang panas. Biasanya itu kebakaran, tapi tidak selalu. Ragu? Telepon atau kirim pesan ke keluargamu.',
    'De grens van het dorp op de kaart is ongeveer. Hij zegt niets over van wie de grond is.':
        'Batas desa di peta hanya perkiraan. Batas ini tidak menunjukkan siapa pemilik tanah.',
    'Bijgewerkt op {d} {m} om {u} (tijd in het dorp). Bronnen: NASA FIRMS (brand), Open-Meteo (weer, lucht en zee), USGS (aardbevingen){bos}, grenzen: wilayah_boundaries.':
        'Diperbarui {d} {m} pukul {u} WIT. Sumber: NASA FIRMS (kebakaran), Open-Meteo (cuaca, udara dan laut), USGS (gempa){bos}, batas wilayah: wilayah_boundaries.',
    ', Global Forest Watch (bos)': ', Global Forest Watch (hutan)',
    # titel en omschrijving
    '{naam} ({plek}): brand, weer en aardbevingen | Kabar Maluku Live': '{naam} ({plek}): kebakaran, cuaca dan gempa | Kabar Maluku Live',
    'Is er brand bij {naam} op {plek}? Zie elk uur wat er speelt: brand, weer voor 7 dagen, zee, lucht en aardbevingen. {kec}, {kab}.':
        'Apakah ada kebakaran di {naam}, {plek}? Lihat setiap jam: kebakaran, cuaca 7 hari, laut, udara dan gempa. {kec}, {kab}.',
    'Hoe is het nu in {naam}?': 'Bagaimana keadaan di {naam} sekarang?',
    'Brand, weer, zee en aardbevingen in {naam} op {plek}. Ieder uur bijgewerkt.': 'Kebakaran, cuaca, laut dan gempa di {naam}, {plek}. Diperbarui setiap jam.',
    'Kabar Maluku Live: wat speelt er in {naam}{op}?': 'Kabar Maluku Live: apa kabar di {naam}{op}?',
    ' op {e}': ', {e}',

    # ---- eilandpagina
    '{n} dorpen': '{n} desa',
    'Deze week zag de satelliet brand bij <b>{n} {d}</b>. Die zijn gemarkeerd met een rode stip.':
        'Minggu ini satelit melihat kebakaran di <b>{n} {d}</b>. Desa itu ditandai dengan titik merah.',
    'dorp': 'desa', 'dorpen': 'desa',
    'Deze week zag de satelliet <b>geen brand</b> bij de dorpen hier.': 'Minggu ini satelit <b>tidak melihat kebakaran</b> di desa-desa ini.',
    'Kies je dorp': 'Pilih desamu',
    'Dorpen in {g}': 'Desa di {g}',
    'Dorpen in {g}: brand, weer en aardbevingen | Kabar Maluku Live': 'Desa di {g}: kebakaran, cuaca dan gempa | Kabar Maluku Live',
    'Alle {n} dorpen in {g} ({sub}). Zie per dorp of er brand is, wat voor weer het wordt en of de aarde beefde.':
        'Semua {n} desa di {g} ({sub}). Lihat per desa apakah ada kebakaran, bagaimana cuacanya dan apakah ada gempa.',
    'Kabar Maluku Live: wat speelt er in de eilandgroep {g}?': 'Kabar Maluku Live: apa kabar di kepulauan {g}?',
    'brand': 'kebakaran',

    # ---- bevingen op de startpagina
    'De beving lag ondiep, ongeveer {km} km onder de grond. Dan voel je hem dichtbij goed.':
        'Gempa ini dangkal, sekitar {km} km di bawah tanah. Di dekatnya gempa seperti ini terasa jelas.',
    'De beving lag ongeveer {km} km onder de grond.': 'Gempa ini sekitar {km} km di bawah tanah.',
    'De beving lag diep: ongeveer {km} km onder de grond. Daardoor komt er boven veel minder kracht aan.':
        'Gempa ini dalam: sekitar {km} km di bawah tanah. Karena itu getarannya jauh lebih lemah di permukaan.',
    'De beving lag heel diep: ongeveer {km} km onder de grond. Daardoor merk je er boven weinig van.':
        'Gempa ini sangat dalam: sekitar {km} km di bawah tanah. Karena itu hampir tidak terasa di permukaan.',
    'Schade is niet te verwachten.': 'Kerusakan tidak diperkirakan.',
    "Schade is bij zo'n lichte beving niet te verwachten.": 'Gempa selemah ini biasanya tidak menimbulkan kerusakan.',
    'Er kunnen spullen zijn omgevallen. Grote schade is niet te verwachten.': 'Barang mungkin ada yang jatuh. Kerusakan besar tidak diperkirakan.',
    'Bel of app je familie als je je zorgen maakt.': 'Telepon atau kirim pesan ke keluargamu kalau kamu khawatir.',
    'Volg ook wat de instanties ter plekke zeggen.': 'Ikuti juga arahan BPBD dan petugas setempat.',
    'Aardbevingen zijn in de Molukken heel gewoon. Het afgelopen jaar waren er {n} met kracht 4 of meer, {hoe}. De meeste merk je nauwelijks.':
        'Gempa sangat biasa di Maluku. Setahun terakhir ada {n} gempa dengan kekuatan 4 atau lebih, {hoe}. Kebanyakan hampir tidak terasa.',
    'ongeveer {n} per week': 'sekitar {n} per minggu',
    'een paar per maand': 'beberapa per bulan',
    'Aardbevingen deze week': 'Gempa minggu ini',
    '<b>Rustig.</b> De afgelopen 7 dagen was er geen beving die mensen merkten. {normaal}':
        '<b>Tenang.</b> Dalam 7 hari terakhir tidak ada gempa yang dirasakan orang. {normaal}',
    'Bijna niemand heeft hem gevoeld.': 'Hampir tidak ada yang merasakannya.',
    'NIET GEVOELD': 'TIDAK TERASA',
    'op {plek}': 'di {plek}', 'in zee bij {plek}': 'di laut dekat {plek}',
    ', vlak bij {stad}': ', dekat {stad}', ', ongeveer {km} km van {stad}': ', sekitar {km} km dari {stad}',
    'in de Molukken': 'di Maluku',
    'Kracht {k}, {waar}{extra}': 'Kekuatan {k}, {waar}{extra}',
    'Wat merkten mensen ervan?': 'Apa yang dirasakan orang?',
    'Bekijk het dichtstbijzijnde dorp, {naam} →': 'Lihat desa terdekat, {naam} →',
    'Afgelopen 7 dagen. Tijden in Nederlandse tijd, met de tijd in de Molukken tussen haakjes.': 'Tujuh hari terakhir. Waktu dalam WIT.',
    'Daarnaast waren er deze week {n} bevingen van kracht 4 of meer die zo diep of zo ver weg lagen dat niemand ze merkte.':
        'Selain itu minggu ini ada {n} gempa dengan kekuatan 4 atau lebih yang begitu dalam atau jauh sehingga tidak ada yang merasakannya.',
    '{normaal} Wil je weten hoe het in jouw dorp voelde? Zoek je dorp hierboven.':
        '{normaal} Mau tahu seberapa terasa di desamu? Cari desamu di atas.',

    # ---- startpagina
    'Brand gezien bij': 'Kebakaran terlihat di',
    'Afgelopen 48 uur, op de grond van het dorp.': '48 jam terakhir, di wilayah desa.',
    'Kabar Maluku Live · powered by MOZA': 'Kabar Maluku Live · didukung oleh MOZA',
    'Wat speelt er bij jouw dorp?': 'Apa kabar di desamu?',
    'brand, beving, lucht en weer': 'kebakaran, gempa, udara dan cuaca',
    'Zoek je dorp of eiland': 'Cari desa atau pulaumu',
    'Bijvoorbeeld Ullath of Seram': 'Misalnya Ullath atau Seram',
    'Jouw dorpen': 'Desamu',
    'Je bewaarde dorpen blijven op deze telefoon of computer staan. <b>Tip:</b> zet Kabar Maluku ook op je beginscherm. iPhone: tik op de deelknop en kies <i>Zet op beginscherm</i>. Android: tik op ⋮ en kies <i>Toevoegen aan startscherm</i>.':
        'Desa yang kamu simpan tetap ada di HP atau komputer ini. <b>Tips:</b> pasang Kabar Maluku di layar utama. iPhone: sentuh tombol bagikan dan pilih <i>Tambahkan ke Layar Utama</i>. Android: sentuh ⋮ dan pilih <i>Tambahkan ke layar utama</i>.',
    'Zo werkt het': 'Cara kerjanya',
    'Zoek je dorp': 'Cari desamu',
    'Typ de naam hierboven. Een oude naam of andere schrijfwijze werkt vaak ook.': 'Ketik namanya di atas. Nama lama atau ejaan lain sering juga bisa.',
    'Lees wat er speelt': 'Baca apa yang terjadi',
    'Brand, weer, lucht, zee en aardbevingen, in gewone woorden en elk uur bijgewerkt.': 'Kebakaran, cuaca, udara, laut dan gempa, dengan kata-kata sederhana dan diperbarui setiap jam.',
    'Deel en zet vast': 'Bagikan dan pasang',
    'Stuur je dorp naar familie via WhatsApp, of zet het als icoontje op je telefoon.': 'Kirim desamu ke keluarga lewat WhatsApp, atau pasang sebagai ikon di HP-mu.',
    'Hoe zet je je dorp vast?': 'Bagaimana memasang desamu di HP?',
    'Open eerst de pagina van je dorp (zoek hierboven). Dan:': 'Buka dulu halaman desamu (cari di atas). Lalu:',
    'Tik op <b>Voeg toe</b>. Je dorp staat nu als icoontje tussen je apps.': 'Sentuh <b>Tambah</b>. Desamu sekarang muncul sebagai ikon di antara aplikasimu.',
    'Tik op <b>Toevoegen</b>. Je dorp staat nu als icoontje tussen je apps.': 'Sentuh <b>Tambahkan</b>. Desamu sekarang muncul sebagai ikon di antara aplikasimu.',
    'Of kies een eilandgroep': 'Atau pilih kepulauan',
    'Of kies op de kaart': 'Atau pilih di peta',
    'Zoom in, tik op een dorp en kies <b>Wat speelt er nu</b>.': 'Perbesar peta, sentuh sebuah desa dan pilih <b>Wat speelt er nu</b>.',
    'Alle dorpen in deze eilandgroep': 'Semua desa di kepulauan ini',
    'Geen dorp gevonden. Probeer een andere schrijfwijze.': 'Desa tidak ditemukan. Coba ejaan lain.',
    'Kabar Maluku Live: brand, weer en aardbevingen bij jouw dorp op de Molukken': 'Kabar Maluku Live: kebakaran, cuaca dan gempa di desamu di Maluku',
    'Zoek je dorp op de Molukken en zie of er brand is, of de lucht gezond is, wat voor weer het wordt en of de aarde beefde. Voor alle 2.420 dorpen, elk uur bijgewerkt.':
        'Cari desamu di Maluku dan lihat apakah ada kebakaran, apakah udaranya sehat, bagaimana cuacanya dan apakah ada gempa. Untuk 2.420 desa, diperbarui setiap jam.',
    'Kabar Maluku Live, powered by MOZA. Wat speelt er bij jouw dorp?': 'Kabar Maluku Live, didukung oleh MOZA. Apa kabar di desamu?',
    'Kabar Maluku Live': 'Kabar Maluku Live',
    'Check wat er speelt in jouw dorp in de Molukken: brand, weer, zee en aardbevingen. Ieder uur bijgewerkt.':
        'Lihat apa yang terjadi di desamu di Maluku: kebakaran, cuaca, laut dan gempa. Diperbarui setiap jam.',
    'Niet gevonden | Kabar Maluku Live': 'Tidak ditemukan | Kabar Maluku Live',
    'Deze pagina bestaat niet.': 'Halaman ini tidak ada.',
    'Dit dorp vinden we niet': 'Desa ini tidak ditemukan',
    'Zoek je dorp →': 'Cari desamu →',

    # ---- eilandgroepen (data.py)
    'Lease-eilanden': 'Kepulauan Lease', 'Banda-eilanden': 'Kepulauan Banda', 'Kei, Aru en Tanimbar': 'Kei, Aru dan Tanimbar',
    'Zuidwest-Molukken': 'Maluku Barat Daya', 'Noord-Molukken': 'Maluku Utara', 'Ambon': 'Ambon', 'Seram': 'Seram', 'Buru': 'Buru',
    'Kota Ambon, Leihitu en Salahutu': 'Kota Ambon, Leihitu dan Salahutu', 'Haruku, Saparua en Nusalaut': 'Haruku, Saparua dan Nusalaut',
    'Met Manipa, Geser en Gorom': 'Termasuk Manipa, Geser dan Gorom', 'Buru en Buru Selatan': 'Buru dan Buru Selatan',
    'Banda Neira en omliggende eilanden': 'Banda Neira dan pulau-pulau sekitarnya', 'Zuidoost-Molukken': 'Maluku bagian tenggara',
    'Wetar, Kisar, Leti, Babar en meer': 'Wetar, Kisar, Leti, Babar dan lainnya',
    'Halmahera, Ternate, Tidore, Bacan en Sula': 'Halmahera, Ternate, Tidore, Bacan dan Sula',
}
