import {Component, OnInit, ViewChild, OnDestroy, TemplateRef} from '@angular/core';
import {LocationsService} from '../shared/locations.service';
import {Observable, Subscription} from 'rxjs';
import {MapInfoWindow, MapMarker} from '@angular/google-maps';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-ubicaciones',
  templateUrl: './ubicaciones.component.html',
  styleUrls: ['./ubicaciones.component.css']
})
export class UbicacionesComponent implements OnInit, OnDestroy {
  @ViewChild(MapInfoWindow, {static: false}) infoWindow: MapInfoWindow;

  items: Observable<any[]>;

  latValue = 9.951309;
  lngValue = -84.046914;
  phone: string;
  descripcion: string;

  center = {lat: this.latValue, lng: this.lngValue};
  zoom = 10;
  display?: google.maps.LatLngLiteral;
  markerOptions = {draggable: false};
  markerPositions: google.maps.LatLngLiteral[] = [];
  locationsSuscription: Subscription;

  modalRef: BsModalRef;

  constructor(private locationsService: LocationsService, private modalService: BsModalService) {}

  ngOnInit() {
    this.locationsSuscription = this.locationsService.getLocationsList().subscribe((result) => {
      console.log(result);
      result.forEach((elemt) => {
        this.markerPositions.push({lat: elemt.post_latitude, lng: elemt.post_longitude});
      });
    });
  }

  ngOnDestroy(): void {
    if (!!this.locationsSuscription) {
      this.locationsSuscription.unsubscribe();
    }
  }

  move(event: google.maps.MouseEvent) {
    this.display = event.latLng.toJSON();
  }

  openInfoWindow(marker: MapMarker) {
    this.infoWindow.open(marker);
  }

  openModal(template: TemplateRef<any>, marker: MapMarker) {
    const lat = marker.getPosition().lat();
    const lng = marker.getPosition().lng();
    console.log(lat, lng);
    this.locationsSuscription = this.locationsService.getLocationsList().subscribe((result) => {
      console.log(result);
      result.forEach((elemt) => {
        if (lat === elemt.post_latitude && lng === elemt.post_longitude) {
          this.descripcion = elemt.post_description;
          this.phone = elemt.phone;
        }
      });
    });
    this.modalRef = this.modalService.show(template);
  }
}
