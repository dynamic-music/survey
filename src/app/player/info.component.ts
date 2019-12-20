import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'info',
  templateUrl: 'info.component.html'
})
export class InfoComponent {
  
  constructor(private modalController: ModalController) {}
  
  dismiss() {
    this.modalController.dismiss({
      'dismissed': true
    });
  }

}