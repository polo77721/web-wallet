import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusTitleComponent } from './components';
import { MainLayoutComponent } from './layouts';
import { HeaderComponent } from './containers';
import { RouterModule } from '@angular/router';
import { HeaderLogoComponent, HeaderPopupComponent, ButtonComponent, MenuComponent } from './components';
import { MenuControlComponent } from './components/menu-control/menu-control.component';
import { ClickOutsideDirective } from './directives/click-outside/click-outside.directive';
import { BeamPipe } from 'app/pipes/beam.pipe';
import { DecimalPipe } from '@angular/common';
import { DropdownComponent } from './components/dropdown/dropdown.component';
import { MenuFullComponent } from './components/menu-full/menu-full.component';

@NgModule({
  declarations: [
    StatusTitleComponent,
    MainLayoutComponent,
    HeaderComponent,
    HeaderLogoComponent,
    HeaderPopupComponent,
    ButtonComponent,
    MenuComponent,
    MenuControlComponent,
    ClickOutsideDirective,
    BeamPipe,
    DropdownComponent,
    MenuFullComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    StatusTitleComponent,
    MainLayoutComponent,
    HeaderComponent,
    ButtonComponent,
    MenuComponent,
    MenuControlComponent,
    ClickOutsideDirective,
    BeamPipe,
    DropdownComponent,
    MenuFullComponent
  ],
  providers: [
    DecimalPipe
  ]
})
export class SharedModule { }
