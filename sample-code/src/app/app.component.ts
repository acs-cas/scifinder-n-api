import {Component} from '@angular/core';
import {BsModalService, ModalOptions} from 'ngx-bootstrap';
import {ModalComponent} from './modal.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less']
})
export class AppComponent {

    private modalConfig: ModalOptions = {
        ignoreBackdropClick: true
    }

    constructor(private modalService: BsModalService) {
    }

    openModal() {
        this.modalService.show(ModalComponent, this.modalConfig);
    }

}
