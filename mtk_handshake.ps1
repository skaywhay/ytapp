Write-Host "Monitoring USB for MediaTek BROM device..."
$found = $false
$timeout = (Get-Date).AddMinutes(5)

while ((Get-Date) -lt $timeout) {
    $dev = Get-PnpDevice -PresentOnly -ErrorAction SilentlyContinue | Where-Object { $_.InstanceId -match '0E8D' }
    if ($dev) {
        Write-Host "Found MediaTek device: " $dev.FriendlyName
        if ($dev.FriendlyName -match '\((COM\d+)\)') {
            $portName = $matches[1]
        } else {
            $portName = "COM4"
        }
        
        Write-Host "Opening $portName..."
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
                    Write-Host ("Handshake: Sent 0x{0:X2}, Got 0x{1:X2}" -f $step.send, $resp)
                    if ($resp -ne $step.expect) {
                        $success = $false
                        break
                    }
                } catch {
                    Write-Host "Timeout reading response for" $step.send
                    $success = $false
                    break
                }
            }
            
            if ($success) {
                Write-Host "=========================================="
                Write-Host ">>> BROM HANDSHAKE SUCCESS! WATCHDOG STOPPED! <<<"
                Write-Host "=========================================="
                Write-Host "Holding port alive for 120s..."
                Start-Sleep -Seconds 120
                $sp.Close()
                $found = $true
                break
            } else {
                $sp.Close()
            }
        } catch {
            Write-Host "Port error:" $_.Exception.Message
        }
    }
    
    $fb = Get-PnpDevice -PresentOnly -ErrorAction SilentlyContinue | Where-Object { $_.InstanceId -match '18D1' }
    if ($fb) {
        Write-Host ">>> FASTBOOT DEVICE DETECTED! <<<"
        $found = $true
        break
    }
    
    Start-Sleep -Milliseconds 40
}

if (-not $found) {
    Write-Host "Finished listening."
}
