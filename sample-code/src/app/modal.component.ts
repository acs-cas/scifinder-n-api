import {
    AfterViewChecked,
    Component,
    ElementRef,
    OnInit,
    ViewChild
} from '@angular/core';
import {MyApplicationAPI} from './MyApplicationAPI';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import * as $ from 'jquery';
import {
    APIStorageKeys,
    ScifinderNUrls,
    SearchType,
    WindowResize,
    WindowSize
} from './constants';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs';
import {WindowRef} from './window-ref';
import {MockMyApplicationAPI} from './MockMyApplicationAPI';
import {BsModalRef} from 'ngx-bootstrap';

declare var MyApplicationAPI: MyApplicationAPI;

@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.less']
})
export class ModalComponent implements OnInit, AfterViewChecked {
    readonly SEARCH_TYPES = SearchType;
    readonly PROXY_URL_STORAGE_KEY = APIStorageKeys.PROXY_URL;
    structure: SafeHtml;
    selectString = '- Select -';
    resultType: string = this.selectString;
    searchMarkush = false;
    referencesText = '';
    proxySettingsExpanded = false;
    proxyUrl = '';
    customClass = 'customClass';
    isAuthenticating: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    showError = {
        serverError: false,
        structureError: false,
        proxyValidationError: false,
        structureErrors: []
    };
    isUnauthorized = false;
    private enableSearch: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    isSearchEnabled: Observable<boolean> = this.enableSearch.asObservable();
    private hasResized = false;

    width: number;
    height: number;

    @ViewChild('textInput') textInput: ElementRef;
    @ViewChild('proxyInput') proxyInput: ElementRef;

    constructor(private sanitizer: DomSanitizer,
                private windowRef: WindowRef,
                private activeModal: BsModalRef) {
    }

    ngOnInit() {
        this.MyApplicationAPI().window.resizeTo(WindowSize.width, WindowSize.height);
        this.width = WindowSize.width;
        this.height = WindowSize.height;
        const structure = this.MyApplicationAPI().activeDocument.selection.getSVG({});
        // https://github.com/angular/angular/issues/9277
        this.structure = this.sanitizer.bypassSecurityTrustHtml(structure);
        try {
            this.loadProxyUrl();
        } catch (error) {
            console.log('proxy setup failed' + error);
        }
    }

    ngAfterViewChecked() {
        if (!this.hasResized) {
            let deltaHeight = 0;
            let errorContainerHeight = 0;
            if (this.isUnauthorized || this.showError.serverError) {
                errorContainerHeight = WindowResize.Padding;
            } else if (this.showError.structureErrors.length) {
                errorContainerHeight = ((this.showError.structureErrors.length + 1) * WindowResize.ErrorMessageHeight) + WindowResize.Padding;
            }
            const referencesTextBoxInnerHeight = $('.references-textbox').innerHeight() || 0;
            const proxySettingsExpandedHeight = this.proxySettingsExpanded ? WindowResize.ProxySettingsElementHeight : 0;
            const proxyUrlErrorHeight = $('.proxy-input-error').innerHeight() || 0;
            deltaHeight = deltaHeight + referencesTextBoxInnerHeight + errorContainerHeight + proxySettingsExpandedHeight + proxyUrlErrorHeight;

            this.resizeWithDeltaHeight(deltaHeight);

            this.hasResized = true;
        }
    }

    changeResultType(resultType: string) {
        this.hasResized = false;
        this.resultType = resultType;
        this.searchMarkush = false;
        this.updateEnableSearch();

        const searchBtn = $('.btn-search');
        // To prevent flicker of Search button styling on add-in load, the button needs to be styled as disabled on start.
        if (this.enableSearch.getValue() && searchBtn.hasClass('btn-disabled')) {
            this.enableSearchButton();
        }
    }

    viewProxySettings() {
        this.hasResized = false;
        this.proxySettingsExpanded = !this.proxySettingsExpanded;
    }

    search() {
        this.activeModal.hide();
    }

    closeWindow() {
        this.activeModal.hide();
    }

    clearTextQuery() {
        this.referencesText = '';
        this.textInput.nativeElement.focus();
    }

    clearProxySettings() {
        this.showError.proxyValidationError = false;
        this.proxyUrl = '';
        localStorage.removeItem(this.PROXY_URL_STORAGE_KEY);
        this.proxyInput.nativeElement.focus();
    }

    private MyApplicationAPI() {
        if (typeof MyApplicationAPI !== 'undefined') {
            return MyApplicationAPI;
        } else {
            return MockMyApplicationAPI.mock;
        }
    }

    private disableSearchButton() {
        const searchBtn = $('.btn-search');
        searchBtn.removeClass('btn-primary');
        searchBtn.addClass('btn-disabled');
    }

    private enableSearchButton() {
        const searchBtn = $('.btn-search');
        searchBtn.addClass('btn-primary');
        searchBtn.removeClass('btn-disabled');
    }

    setupProxyAndStore() {
        this.hasResized = false;
        this.updateEnableSearch();
        if (this.isProxyUrlInvalid()) {
            this.showError.proxyValidationError = true;
            return;
        }
        this.showError.proxyValidationError = false;
        try {
            this.storeProxyUrl();
        } catch (error) {
            console.error('proxy store failed for proxy: ' + this.proxyUrl);
        }
    }

    private isProxyUrlInvalid() {
        const regex = new RegExp('(?:http(s)?:\\/\\/)?[\\w.-]+(?:\\.[\\w\\.-]+)+[\\w\\-\\._~:/?#[\\]@!\\$&\'\\(\\)\\*\\+,;=.]+');
        return this.proxyUrl.length !== 0 && !regex.test(this.proxyUrl);
    }

    private storeProxyUrl() {
        if (this.hasProxyUrl()) {
            localStorage.setItem(this.PROXY_URL_STORAGE_KEY, this.proxyUrl);
        } else {
            localStorage.removeItem(this.PROXY_URL_STORAGE_KEY);
        }
        console.log('saved proxy url ...' + this.proxyUrl);
    }

    private loadProxyUrl() {
        const storedProxyUrl = localStorage.getItem(this.PROXY_URL_STORAGE_KEY);
        if (typeof storedProxyUrl !== 'string' && !storedProxyUrl && storedProxyUrl !== ScifinderNUrls.production) {
            this.proxyUrl = '';
        } else {
            this.proxyUrl = storedProxyUrl;
        }
        console.log('loaded proxy url ...' + this.proxyUrl);
    }

    private updateEnableSearch() {
        this.enableSearch.next(
            this.selectString !== this.resultType
            && !this.isProxyUrlInvalid()
            && !this.showError.structureError
            && !this.showError.serverError
            && !this.isUnauthorized
        );
        if (this.enableSearch.getValue()) {
            this.enableSearchButton();
        } else {
            this.disableSearchButton();
        }
    }

    private resizeWithDeltaHeight(deltaHeight: number) {
        const windowInnerWidth = this.windowRef.nativeWindow.innerWidth;
        const windowInnerHeight = this.windowRef.nativeWindow.innerHeight;

        const width = windowInnerWidth > WindowSize.width ? windowInnerWidth : WindowSize.width;
        const height = windowInnerHeight > WindowSize.height + deltaHeight ? windowInnerHeight : WindowSize.height + deltaHeight;

        if (windowInnerWidth !== width || windowInnerHeight !== height) {
            this.MyApplicationAPI().window.resizeTo(width, height);
        }
    }

    private hasProxyUrl(): boolean {
        return this.proxyUrl.length !== 0;
    }

}
