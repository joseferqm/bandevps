import {TestBed, async} from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {AppComponent, APP_TITLE} from './app.component';
import {HeaderComponent} from './header/header.component';
import {AngularFireModule} from '@angular/fire';
import {AngularFireDatabaseModule} from '@angular/fire/database';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {environment} from '../environments/environment';
import {TimerComponent} from './timer/timer.component';
import {StoreModule} from '@ngrx/store';
import {reducers} from './state/reducers';
import {NgxSpinnerModule} from 'ngx-spinner';
import {SpinnerService} from './shared/spinner.service';
import {ToastrModule} from 'ngx-toastr';
import {ModalModule} from 'ngx-bootstrap/modal';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        AngularFireModule.initializeApp(environment.firebaseConfig),
        AngularFireDatabaseModule,
        AngularFireAuthModule,
        StoreModule.forRoot(reducers),
        NgxSpinnerModule,
        ToastrModule.forRoot(),
        ModalModule.forRoot()
      ],
      declarations: [AppComponent, HeaderComponent, TimerComponent],
      providers: [{provide: APP_TITLE, useValue: 'The Iron Bank'}, SpinnerService]
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'The Iron Bank'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('The Iron Bank');
  });

  it('should render app-header tag', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('app-header').textContent).toBeDefined();
  });

  it('should render router-outlet tag', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('router-outlet').textContent).toBeDefined();
  });
});
