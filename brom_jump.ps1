Write-Host "Monitoring USB for MediaTek BROM device..."
$found = $false
$timeout = (Get-Date).AddMinutes(5)

while ((Get-Date) -lt $timeout) {
    $dev = Get-PnpDevice -PresentOnly -ErrorAction SilentlyContinue | Where-Object { $_.InstanceId -match '0E8D' }
    if ($dev) {
        if ($dev.FriendlyName -match '\((COM\d+)\)') {
            $portName = $matches[1]
        } else {
            $portName = "COM4"
        }
        
        Write-Host "Connecting to $portName..."
        try {
            $sp = New-Object System.IO.Ports.SerialPort($portName, 115200)
            $sp.ReadTimeout = 400
            $sp.WriteTimeout = 400
            $sp.Open()
            
            $seq = @(
                @{ send = 0xA0; expect = 0x5F },
                @{ send = 0x0A; expect = 0xF5 },
                @{ send = 0x50; expect = 0xAF },
                @{ send = 0x05; expect = 0xFA }
            )
            
            $success = $true
            foreach ($step in $seq) {
                $buf = [byte[]]@($step.send)
                $sp.Write($buf, 0, 1)
                try {
                    $resp = $sp.ReadByte()
                    if ($resp -ne $step.expect) {
                        $success = $false
                        break
                    }
                } catch {
                    $success = $false
                    break
                }
            }
            
            if ($success) {
                Write-Host ">>> Handshake OK! Sending JUMP_BL (boot to Fastboot)... <<<"
                $sp.Write([byte[]]@(0xD6), 0, 1)
                try {
                    $echo = $sp.ReadByte()
                    $b1 = $sp.ReadByte()
                    $b2 = $sp.ReadByte()
                    Write-Host ">>> Command accepted by processor! Device rebooting to bootloader... <<<"
                } catch {}
                try { $sp.Close() } catch {}
                $found = $true
                break
            } else {
                try { $sp.Close() } catch {}
            }
        } catch {}
    }
    
    $fb = Get-PnpDevice -PresentOnly -ErrorAction SilentlyContinue | Where-Object { $_.InstanceId -match '18D1' }
    if ($fb) {
        Write-Host "=========================================="
        Write-Host ">>> FASTBOOT DEVICE DETECTED! SUCCESS! <<<"
        Write-Host "=========================================="
        $found = $true
        break
    }
    
    Start-Sleep -Milliseconds 40
}

if (-not $found) {
    Write-Host "Finished listening."
}
