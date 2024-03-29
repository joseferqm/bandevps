import {Component, OnInit, AfterContentChecked, ChangeDetectorRef} from '@angular/core';
import {FormGroup, FormControl, ValidatorFn, ValidationErrors} from '@angular/forms';
import {SpinnerService} from '../shared/spinner.service';
import {UserService} from '../shared/user.service';
import {AngularFireAuth} from '@angular/fire/auth';
import {UserData, UserInformation} from '../shared/models';
import {NotificationService} from '../shared/notification.service';
import {Router} from '@angular/router';
import {UtilsService} from '../shared/utils.service';

enum RegistrationError {
  INVALID_CLIENT,
  ALREADY_REGISTERED,
  INVALID_PASSWORD,
  ERROR
}

export const differentPasswordsValidator: ValidatorFn = (
  control: FormGroup
): ValidationErrors | null => {
  const pass = control.get('password');
  const passConf = control.get('passwordConf');

  return pass && passConf && pass.value !== passConf.value
    ? {differentPasswordsValidator: true}
    : null;
};

@Component({
  selector: 'app-register-user',
  templateUrl: './register-user.component.html',
  styleUrls: ['./register-user.component.css']
})
export class RegisterUserComponent implements OnInit, AfterContentChecked {
  userIdForm: FormGroup;
  userRegistrationForm: FormGroup;
  userCanRegister = false;
  private userData: UserData;

  constructor(
    private spinnerService: SpinnerService,
    private userService: UserService,
    private firebaseAuth: AngularFireAuth,
    private notificationService: NotificationService,
    private router: Router,
    private cdRef: ChangeDetectorRef,
    private utilsService: UtilsService
  ) {}

  ngOnInit() {
    this.userIdForm = new FormGroup({
      id: new FormControl('')
    });
    this.userRegistrationForm = new FormGroup(
      {
        name: new FormControl(''),
        email: new FormControl(''),
        password: new FormControl(''),
        passwordConf: new FormControl(''),
        phoneNumber: new FormControl(''),
        address: new FormControl(''),
        occupation: new FormControl('')
      },
      {validators: differentPasswordsValidator}
    );
  }

  ngAfterContentChecked(): void {
    this.cdRef.detectChanges();
  }

  onSubmitUserIdForm() {
    this.spinnerService.showMainSpinner();
    let errorMessage;
    this.checkUserCanRegister()
      .then((userData: UserData) => {
        this.userData = userData;
        const maskedEmail = this.utilsService.getMaskedEmail(this.userData.email);
        this.userCanRegister = true;
        this.userIdForm.get('id').disable();
        this.userRegistrationForm.get('name').patchValue(this.userData.fullName);
        this.userRegistrationForm.get('name').disable();
        this.userRegistrationForm.get('email').patchValue(maskedEmail);
        this.userRegistrationForm.get('email').disable();
      })
      .catch((error) => {
        if (error === RegistrationError.INVALID_CLIENT) {
          errorMessage =
            'No se encontró ningún cliente para el número de identificación ingresado.';
        } else if (error === RegistrationError.ALREADY_REGISTERED) {
          errorMessage =
            'Ya existe una cuenta de usuario para el número de identificación ingresado.';
        } else {
          errorMessage = 'Ha ocurrido un error. Por favor verifique los datos e intente de nuevo.';
        }
      })
      .finally(() => {
        if (!!errorMessage) {
          this.notificationService.showErrorMessage(
            'Error al recuperar los datos del usuario',
            errorMessage
          );
        }
        this.spinnerService.hideMainSpinner();
      });
  }

  onSubmitUserRegistrationForm() {
    this.spinnerService.showMainSpinner();
    let errorMessage;
    this.registerUser()
      .then(() => {
        this.router.navigate(['/home']);
      })
      .catch((error) => {
        if (error === RegistrationError.INVALID_PASSWORD) {
          errorMessage = 'La contraseña debe ser más segura. Incluya al menos seis caracteres.';
        } else {
          errorMessage = 'Ha ocurrido un error. Por favor verifique los datos e intente de nuevo.';
        }
      })
      .finally(() => {
        if (!!errorMessage) {
          this.notificationService.showErrorMessage(
            'Error al crear al crear la cuenta de usuario',
            errorMessage
          );
        }
        this.spinnerService.hideMainSpinner();
      });
  }

  resetForms() {
    this.resetUserIdForm();
    this.userRegistrationForm.reset();
  }

  resetUserIdForm() {
    this.userIdForm.reset();
    this.userIdForm.get('id').enable();
  }

  checkUserCanRegister() {
    const id = this.userIdForm.get('id').value;

    return new Promise((resolve, reject) => {
      this.userService
        .getUserDataFromFirebaseWithId(id)
        .then((idResult: UserData) => {
          // Usuario se encuentra en colección de users => usuario que es cliente del banco

          // Campo registered debe ser válido
          if (idResult.registered) {
            // Usuario ya se ha registrado para el sistema en línea => no continuar registro
            reject(RegistrationError.ALREADY_REGISTERED);
          } else {
            // Usuario no se ha registrado para el sistema en línea => continuar registro
            resolve(idResult);
          }
        })
        .catch((error) => {
          if (error === 'INVALID_ID') {
            // Usuario no se encuentra en colección de users => usuario que no es cliente del banco => no continuar registro
            reject(RegistrationError.INVALID_CLIENT);
          } else {
            // Otro tipo de error
            reject(error);
          }
        });
    });
  }

  registerUser() {
    const email = this.userData.email;
    const password = this.userRegistrationForm.get('password').value;
    const userInfo: UserInformation = {
      address: this.userRegistrationForm.get('address').value,
      occupation: this.userRegistrationForm.get('occupation').value,
      phoneNumber: this.userRegistrationForm.get('phoneNumber').value
    };
    let firstStepCompleted = false;

    return new Promise((resolve, reject) => {
      this.userService
        .insertUserInfoAndSetUserRegistered(this.userData.id, userInfo)
        .then(() => {
          firstStepCompleted = true;
          return this.firebaseAuth.createUserWithEmailAndPassword(email, password);
        })
        .then((result) => {
          console.log('result', result);
          resolve();
        })
        .catch((error) => {
          console.log('error', error);

          let registrationError;
          if (!!error.code && error.code === 'auth/weak-password') {
            registrationError = RegistrationError.INVALID_PASSWORD;
          } else {
            registrationError = RegistrationError.ERROR;
          }

          if (firstStepCompleted) {
            this.userService.invalidateUser(this.userData.id);
          }
          reject(registrationError);
        });
    });
  }
}
