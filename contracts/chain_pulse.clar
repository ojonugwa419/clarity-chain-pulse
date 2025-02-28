;; ChainPulse Contract
;; Monitors and stores blockchain activity metrics

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-invalid-time (err u101))
(define-constant err-no-data (err u102))

;; Data structures
(define-map activity-metrics uint 
  { 
    timestamp: uint,
    tx-count: uint,
    volume: uint,
    active-addresses: uint
  }
)

(define-data-var last-record-id uint u0)
(define-data-var total-records uint u0)

;; Record new blockchain activity
(define-public (record-activity (tx-count uint) (volume uint) (active-addresses uint))
  (let
    (
      (current-time (get-block-info! time (- block-height u1)))
      (new-id (+ (var-get last-record-id) u1))
    )
    (if (is-eq tx-sender contract-owner)
      (begin
        (map-set activity-metrics new-id
          {
            timestamp: current-time,
            tx-count: tx-count,
            volume: volume,
            active-addresses: active-addresses
          }
        )
        (var-set last-record-id new-id)
        (var-set total-records (+ (var-get total-records) u1))
        (ok new-id)
      )
      err-owner-only
    )
  )
)

;; Get metrics for a specific time period
(define-public (get-metrics (start-time uint) (end-time uint))
  (if (> start-time end-time)
    err-invalid-time
    (ok (filter-metrics start-time end-time))
  )
)

;; Generate activity report
(define-public (generate-report (timestamp uint))
  (let ((metrics (get-metrics-at timestamp)))
    (if (is-none metrics)
      err-no-data
      (ok (some metrics))
    )
  )
)

;; Helper function to get metrics at timestamp
(define-private (get-metrics-at (timestamp uint))
  (map-get? activity-metrics timestamp)
)

;; Helper function to filter metrics by time range
(define-private (filter-metrics (start-time uint) (end-time uint))
  (filter check-time-range (map unwrap-metrics (get-metrics-list)))
)

;; Helper functions for metrics processing
(define-private (check-time-range (metric {timestamp: uint, tx-count: uint, volume: uint, active-addresses: uint}))
  (and 
    (>= (get timestamp metric) start-time)
    (<= (get timestamp metric) end-time)
  )
)

(define-private (get-metrics-list)
  (map (unwrap-panic (map-get? activity-metrics))
    (sequence (var-get total-records))
  )
)

(define-private (unwrap-metrics (metric (optional {timestamp: uint, tx-count: uint, volume: uint, active-addresses: uint})))
  (default-to 
    {timestamp: u0, tx-count: u0, volume: u0, active-addresses: u0}
    metric
  )
)
