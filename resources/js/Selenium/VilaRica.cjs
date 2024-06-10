const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');

// Configuração do WebDriver
const driver = new Builder().forBrowser('chrome').build();

(async function scrapeData() {
  try {
    await driver.get('https://www.vilarica.com.br/comprar/prontos/sao-leopoldo-rs');
    await driver.manage().setTimeouts({ implicit: 10000 });

    // Aceitando cookies
    let botaoCookies = await driver.findElement(By.className('lgpd-accept'));
    await botaoCookies.click();

    // Criando uma pasta para armazenar os screenshots
    if (!fs.existsSync('screenshots')) {
      fs.mkdirSync('screenshots');
    }

    // Encontrando os anúncios
    let anuncios = await driver.findElements(By.className('wrap-link'));

    // Verificando se o arquivo JSON já existe
    let data = [];
    if (fs.existsSync('historico_anuncios.json')) {
      const rawData = fs.readFileSync('historico_anuncios.json');
      data = JSON.parse(rawData);
    }

    // Iterando sobre os anúncios
    for (let i = 0; i < anuncios.length; i++) {
      let anuncio = anuncios[i];
      let url = await anuncio.getAttribute('href');
      let local, preco;

      try {
        local = await anuncio.findElement(By.xpath(".//p[@class='location']")).getText();
      } catch (error) {
        local = 'Local não encontrado';
      }

      try {
        preco = await anuncio.findElement(By.xpath(".//p[@class='price']")).getText();
      } catch (error) {
        preco = 'Preço não encontrado';
      }

      console.log(`URL: ${url}`);
      console.log(`Local: ${local}`);
      console.log(`Preço: ${preco}`);
      console.log('-'.repeat(50));

      let screenshotPath = path.join('screenshots', `anuncio_${i + 1}.png`);
      await anuncio.takeScreenshot().then(
        function(image, err) {
          fs.writeFileSync(screenshotPath, image, 'base64');
        }
      );
      console.log(`Screenshot salvo em: ${screenshotPath}`);

      data.push({
        data: new Date().toISOString(),
        url: url,
        local: local,
        preco: preco,
        screenshot: screenshotPath
      });
    }

    // Salvando os dados no arquivo JSON
    fs.writeFileSync('historico_anuncios.json', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await driver.quit();
  }
})();
