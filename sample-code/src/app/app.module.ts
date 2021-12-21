import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {ModalComponent} from './modal.component';
import {AccordionModule, BsDropdownModule} from 'ngx-bootstrap';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {WindowRef} from './window-ref';
import {ModalModule} from 'ngx-bootstrap';
import {AngularDraggableModule} from 'angular2-draggable';

@NgModule({
    declarations: [
        AppComponent,
        ModalComponent
    ],
    imports: [
        AccordionModule.forRoot(),
        BrowserAnimationsModule,
        BrowserModule,
        BsDropdownModule.forRoot(),
        FormsModule,
        RouterModule.forRoot([]),
        ModalModule.forRoot(),
        AngularDraggableModule,
    ],
    providers: [WindowRef],
    entryComponents: [
        ModalComponent
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
