import { Component, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { BarcodeScanner, SupportedFormat } from '@capacitor-community/barcode-scanner';
import { AlertController } from '@ionic/angular';
import { HAS_LETTER_AND_NUMBER, HAS_UPPERCASE, HAS_NUMBER } from 'src/app/constant/constant'
import { Cedula } from '../constant/info.interface';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements AfterViewInit, OnDestroy {
  result = null;
  scanActivate = false;
  public info: Cedula;
  public numIdentificacion: number;
  public nombre: string;
  public segNombre: string;
  public apellido: string;
  public segApellido: string;
  public genero: string;
  public fechaNacimiento: any;
  public tipoSangre: string;

  constructor(private alertController: AlertController) { }

  ngAfterViewInit() {
    BarcodeScanner.prepare()
  }

  ngOnDestroy() {
    BarcodeScanner.stopScan();
  }

  async startScanner() {
    const allowed = await this.permisoCheck();
    if (allowed) {
      this.scanActivate = true;
      const result = await BarcodeScanner.startScan({ targetedFormats: [SupportedFormat.PDF_417] });
      this.extractColDocumentData(result.content);
      if (result.hasContent) {
        this.result = result.content
        this.scanActivate = false;
      }
    }

  }

  async permisoCheck() {
    return new Promise(async (resolve, reject) => {
      const status = await BarcodeScanner.checkPermission({ force: true });
      if (status.granted) {
        resolve(true)
      } else if (status.denied) {
        const alert = await this.alertController.create({
          header: 'No Permission',
          message: 'please allow camera access in your setting',
          buttons: [{
            text: 'No',
            role: 'cancel'
          },
          {
            text: 'Open Setting',
            handler: () => {
              BarcodeScanner.openAppSettings();
              resolve(false);
            }
          }]
        });
        await alert.present();
      } else {
        resolve(false)
      }
    });
  }

  stopScanner() {
    BarcodeScanner.stopScan();
    this.scanActivate = false;
  }

  extractColDocumentData(data) {
    const info = data.replace(HAS_LETTER_AND_NUMBER, ' ').split(' ');
    let indexMod = 0;
    if (HAS_UPPERCASE.test(info[3])) {
      indexMod = - 1;
      const idString = info[3].replace(HAS_UPPERCASE, '');
      this.numIdentificacion = idString.substr(10, idString.length);
      this.apellido = info[3].replace(HAS_NUMBER, '');
    } else {
      this.numIdentificacion = info[4].replace(HAS_UPPERCASE, '');
      this.apellido = info[4].replace(HAS_NUMBER, '');
    }

    this.segApellido = info[5 + indexMod];
    this.nombre = info[6 + indexMod];

    if (!(HAS_NUMBER.test(info[7 + indexMod]))) {
      this.segNombre = info[7 + indexMod];
    }

    const extraInfo = info[this.segNombre ? 8 + indexMod : 7 + indexMod];
    this.genero = extraInfo.includes('M') ? 'M' : 'F';
    this.fechaNacimiento = extraInfo.substr(2, 8);
    this.tipoSangre = extraInfo.substr(-2);

    this.info = {
      num: this.numIdentificacion,
      nombre: `${this.nombre} ${this.segNombre || ''}`,
      apellido: `${this.apellido} ${this.segApellido || ''}`,
      genero: this.genero,
      cumple: this.fechaNacimiento.replace(/[^\dA-Z]/g, ' ').replace(/(.{4})/g, '$1/').replace(/(.{7})/g, '$1/').trim(),
      sangre: this.tipoSangre,
    };
  }
}
