info.setLife(3)
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    info.changeLifeBy(-1)
})
